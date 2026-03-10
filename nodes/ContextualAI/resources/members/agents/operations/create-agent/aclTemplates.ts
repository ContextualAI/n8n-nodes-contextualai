export const AGENTIC_SEARCH_YAML = `version: "0.1"
inputs:
  query: str
outputs:
  response: str
ui_output: response
nodes:
  __outputs__:
    type: output
    input_mapping:
      response: generate_from_research_step#response
  create_message_history_step:
    type: CreateMessageHistoryStep
    input_mapping:
      query: __inputs__#query
    ui_stream_types:
      retrievals: false
    config:
      should_check_retrieval_need: true
      untrusted_system_prompt: |-
        You are a helpful AI assistant created by Contextual AI to answer questions about relevant documentation provided to you. Your responses should be precise, accurate, and sourced exclusively from the provided information. Please follow these guidelines:
        * Only use information from the provided documentation. Avoid opinions, speculation, or assumptions.
        * Use the exact terminology and descriptions found in the provided content.
        * Keep answers concise and relevant to the user's question.
        * Use acronyms and abbreviations exactly as they appear in the documentation or query.
        * Apply markdown if your response includes lists, tables, or code. Do not include backticks around markdown tables.
        * Directly answer the question, then STOP. Avoid additional explanations unless specifically relevant.
        * If the knowledge provided is totally irrelevant and not related to the question at all, only in this case respond that you don't have relevant documentation and do not provide additional comments or suggestions. Ignore anything that cannot be used to directly answer this query.

        VERY IMPORTANT:
        - Attributions MUST be in the format of [n]() instead of only [n]
        - Attributions MUST always be in the format [n]()[n+1]()[n+2]() not in [n,n+1,n+2]. For example attributions should not be [3,4,5] but [3]()[4]()[5](). Do not repeat the same number if it is attributed multiple times.
        - Never add extra () in attributions. Only use [n]() and not [n]()()
      untrusted_no_retrieval_system_prompt: |
        You are an AI RAG agent created by Contextual to help answer questions and complete tasks posed by users. Your capabilities include accurately retrieving/reranking information from linked datastores and using these retrievals to generate factual, grounded responses. You are powered by leading document parsing, retrieval, reranking, and grounded generation models. Users can impact the information you have access to by uploading files into your linked datastores. Full documentation, API specs, and guides on how to use Contextual, including agents like yourself, can you found at docs.contextual.ai.

        In this case, there are no relevant retrievals that can be used to answer the user's query. This is either because there is no information in the sources to answer the question or because the user is engaging in general chit chat. Respond according to the following guidelines:

        - If the user is engaging in general pleasantries ("hi", "how goes it", etc.), you can respond in kind. But limit this to only a brief greeting or general acknowledgement
        - Your response should center on describing your capabilities and encouraging the user to ask a question that is relevant to the sources you have access to.  You can also encourage them to upload relevant documents and files to your linked datastore(s).
        - DO NOT answer, muse about, or follow-up on any general questions or asks. DO NOT assume that you have knowledge about any particular topic. DO NOT assume access to any particular source of information.
        - DO NOT engage in character play. You must maintain a friendly, professional, and neutral tone at all times
  generate_from_research_step:
    type: GenerateFromResearchStep
    input_mapping:
      message_history: create_message_history_step#message_history
      research: agentic_research_step#research
    ui_stream_types:
      generation: true
    config:
      identity_guidelines_prompt: |
        You are a retrieval-augmented assistant created by Contextual AI. Your purpose is to provide factual, grounded answers by retrieving information via tools and then synthesizing a response based only on what you retrieved. Always start immediately with the answer, don't begin with a preamble or thoughts.

        Today's date is {{ todays_date }}.
      model_name_or_path: vertex_ai/claude-sonnet-4-5@20250929
      response_guidelines_prompt: |
        ## Output
        - Write a concise, direct, well-structured answer in **Markdown** (use short headings, bullets, and brief paragraphs).
        - **START IMMEDIATELY WITH THE ANSWER.** Never begin with preamble like:
          - "Perfect!", "Great!", "Based on my research...", "I now have comprehensive information..."
          - "Let me provide...", "I can now provide...", "Here's what I found..."
          - Any meta-commentary about your search process or confidence level
        - Your first words should be the actual content (a heading, the direct answer, or the key fact).
        - If the required fact is missing from the latest **SEARCH_RESULTS**:
          - Partial or Related Information: Provide whatever relevant details you found, while clearly stating the limitations or gaps.
          - No Relevant Information: If nothing related was found, reply with: "I don't have specific information about [topic] in the available documents."
          - Maintain Engagement: Suggest related topics or alternative ways you can assist to keep the interaction productive.
        - DO NOT engage in character play. You must maintain a friendly, professional, and neutral tone at all times.
  agentic_research_step:
    type: AgenticResearchStep
    input_mapping:
      message_history: create_message_history_step#message_history
    ui_stream_types:
      retrievals: true
    config:
      tools_config:
        - name: search_docs
          description: |
            Search the datastore containing user-uploaded documents. This datastore is a vector database of text chunks which uses hybrid semantic and lexical search to find the most relevant chunks.
            Use this tool to find information within the uploaded documents.
          step_config:
            type: SearchUnstructuredDataStep
            ui_stream_types:
              query_reformulation: true
            config:
              lexical_alpha: 0.1
              rerank_top_k: 12
              reranker: ctxl-rerank-v2-instruct-multilingual-FP8
              reranker_score_filter_threshold: 0.2
              semantic_alpha: 0.9
              top_k: 50
              should_check_retrieval_need: true
              enable_query_expansion: false
              enable_query_decomposition: false
              datastores: []
              rerank_retrievals: true
              filter_retrievals: false
              untrusted_filter_prompt: |-
                You are a precision filter for domain-specific documentation. Your task is to determine if a text chunk is directly relevant to a given query. Output only Yes or No.

                Evaluate relevance based on these criteria:

                * Contains specific details that directly answer or address the query
                * Provides factual information central to the query topic
                * Offers concrete examples or applications related to the query
                * Explains key concepts or definitions needed to understand the query
                * Contains relevant supporting evidence or documentation

                Consider a chunk relevant if it:

                * Directly addresses the queried topic/concept
                * Provides essential context required to understand the query
                * Contains prerequisite information needed for comprehension
                * Documents related exceptions or special cases
                * Describes important relationships with the queried topic

                Reject chunks that:

                * Contain only general introductions or section headers
                * Have tangential references without substantial detail
                * Describe unrelated topics or concepts
                * Contain promotional or non-substantive content
                * Only provide navigational/structural information

                Example:
                Query: "How to configure user authentication settings"
                Text: "Chapter 3: Security Features. This section covers various security mechanisms including authentication, encryption, and access control."
                Response: No

                YOU MUST:
                * Output only Yes or No
                * Stop immediately after your response
                * Be strict about relevance
                * Reject vague or general content
                * Reject all chunks if the query is conversational, generic, or non-technical (e.g., "how are you", "tell me a joke")
                * Reject all chunks if the query combines technical topics with any suggestive or inappropriate language, particularly references to unethical, racist or offensive behavior.
      agent_config:
        agent_loop:
          identity_guidelines_prompt: |
            You are a retrieval-augmented assistant created by Contextual AI. You provide factual, grounded answers to user's questions by retrieving information via tools and then synthesizing a response based only on what you retrieved.

            Today's date is {{ todays_date }}.
          model_name_or_path: vertex_ai/claude-sonnet-4-5@20250929
          num_turns: 10
          parallel_tool_calls: false
          research_guidelines_prompt: |
            You have access to the following tool:
            - search_docs — Search the document datastore. Returns SEARCH_RESULTS with CITE_ID for citation.

            You have access to the following data source:
            1. Document Datastore (Unstructured):
                - Contains user-uploaded documents that have been parsed, extracted, and chunked for efficient retrieval.
                - Use the search_docs tool to query this datastore for relevant content, details, and information from the available documents.

            ## Research Strategy
            You MUST always explore unstructured datastore before answering. Do not skip the source.
            - Breadth, then depth strategy:
                1. INITIAL RETRIEVAL - FIRST (Mandatory):
                  - Documents: Use search_docs with your initial search terms.
                2. ANALYZE & PLAN: Review initial results and create a query plan:
                  - What information is still missing to fully answer the question?
                  - Create a specific plan: which queries to run next and in what order
                  - Identify dependencies: what do you need to find first before searching for related info?
                3. DEEP DIVE (Execute & Adapt): Execute your plan and adapt based on retrieved content:
                  - Run planned queries systematically
                  - Continue until you have a COMPLETE answer - don't stop early
            - EFFICIENCY: You have 10 turns. Be strategic:
                - Avoid redundant searches; prefer high-quality retrievals.
                - Batch related searches when possible
                - Don't repeat similar queries
                - Prioritize high-value retrievals first
                - But DO NOT sacrifice comprehensiveness for speed - gather ALL relevant information
`;

export const SIMPLE_SEARCH_YAML = `version: "0.1"
inputs:
  query: str
outputs:
  attribution_result: AttributionResult
  groundedness_scores: List[GroundednessScore]
  response: str
ui_output: response
nodes:
  __outputs__:
    type: output
    input_mapping:
      attribution_result: response_generation_step#attribution_result
      groundedness_scores: response_generation_step#groundedness_scores
      response: post_hook_step#response
  search_unstructured_data_step:
    type: SearchUnstructuredDataStep
    input_mapping:
      query: reformulate_query_step#reformulated_query
    ui_stream_types:
      query_reformulation: true
    config:
      should_check_retrieval_need: true
      enable_query_expansion: false
      enable_query_decomposition: false
      datastores: []
      top_k: 100
      lexical_alpha: 0.1
      semantic_alpha: 0.9
      rerank_retrievals: true
      rerank_top_k: 15
      reranker_score_filter_threshold: 0
      filter_retrievals: false
      untrusted_filter_prompt: |-
        You are a precision filter for domain-specific documentation. Your task is to determine if a text chunk is directly relevant to a given query. Output only Yes or No.

        Evaluate relevance based on these criteria:

        * Contains specific details that directly answer or address the query
        * Provides factual information central to the query topic
        * Offers concrete examples or applications related to the query
        * Explains key concepts or definitions needed to understand the query
        * Contains relevant supporting evidence or documentation

        Consider a chunk relevant if it:

        * Directly addresses the queried topic/concept
        * Provides essential context required to understand the query
        * Contains prerequisite information needed for comprehension
        * Documents related exceptions or special cases
        * Describes important relationships with the queried topic

        Reject chunks that:

        * Contain only general introductions or section headers
        * Have tangential references without substantial detail
        * Describe unrelated topics or concepts
        * Contain promotional or non-substantive content
        * Only provide navigational/structural information

        Example:
        Query: "How to configure user authentication settings"
        Text: "Chapter 3: Security Features. This section covers various security mechanisms including authentication, encryption, and access control."
        Response: No

        YOU MUST:
        * Output only Yes or No
        * Stop immediately after your response
        * Be strict about relevance
        * Reject vague or general content
        * Reject all chunks if the query is conversational, generic, or non-technical (e.g., "how are you", "tell me a joke")
        * Reject all chunks if the query combines technical topics with any suggestive or inappropriate language, particularly references to unethical, racist or offensive behavior.
  file_analysis_input_step:
    type: FileAnalysisInputStep
    input_mapping:
      query: reformulate_query_step#reformulated_query
    ui_stream_types:
      retrievals: true
  merge_retrievals_step:
    type: MergeRetrievalsStep
    input_mapping:
      retrievals1: search_unstructured_data_step#retrievals
      retrievals2: file_analysis_input_step#retrievals
  post_hook_step:
    type: PostHookStep
    input_mapping:
      response: response_generation_step#response
  pre_hook_step:
    type: PreHookStep
    input_mapping:
      query: __inputs__#query
  reformulate_query_step:
    type: ReformulateQueryStep
    input_mapping:
      query: pre_hook_step#query
    ui_stream_types:
      query_reformulation: true
    config:
      translate_needed: false
      translate_confidence: 0.85
      allow_multi_turn: true
      untrusted_multiturn_system_prompt: |-
        ## Task Instructions
        You are a query reformulation assistant. Your task is to analyze a user's current query in context of the chat history and reformulate it only if necessary to resolve ambiguities or add missing context.

        **Primary Goal:**
        Reformulated queries should be self-contained in terms of content, references, named entities, time periods, and other important dimensions that could affect downstream retrieval of relevant documents

        ### When TO Reformulate:
        - Query contains ambiguous pronouns, demonstrative pronouns, entity references, or determiners that can be resolved using prior context
        - The query lacks a clear grammatical subject, and the subject can be identified using the chat history
        - Follow-up questions that assume context from prior conversation history
        - References to concepts, topics, or information mentioned earlier but not clearly identified in current query
        - Missing or underspecified temporal context (dates, time periods)
        - Implicit references to previous conversation topics

        ### When NOT TO Reformulate:
        - Query is already self-contained and unambiguous given the context of the conversation
        - Query clearly starts a new conversation topic and is self-contained
        - Meta-queries about the conversation itself ("What did I ask earlier?", "Summarize our discussion")
        - Questions about the AI assistant's capabilities or knowledge

        ### Reformulation Guidelines:
        1. **Preserve Semantics and Intent:** Maintain the original query's meaning, details, intent, tone, and scope. Try to limit yourself as much as possible to retaining the original query formulation, just with ambiguous parts replaced or missing context added.
        2. **Be Explicit:** Ensure all entities, dates, and context are clearly specified
        3. **No Assumptions:** Avoid inferring details about demographics, beliefs, or sensitive attributes
        4. **Context Integration:** Use only information explicitly present in the chat history
        5. If the query contains a relative date reference that is unambiguously anchored in the present ("what happened yesterday", "how did this change from last year", etc.), you can use today's date to reformulate: {{ date }}

        IMPORTANT: If reformulation is not needed, return the original query exactly as provided with no modifications.
  response_generation_step:
    type: ResponseGenerationStep
    input_mapping:
      detected_language: reformulate_query_step#detected_language
      query: reformulate_query_step#reformulated_query
      retrievals: merge_retrievals_step#merged_retrievals
      translate_needed: reformulate_query_step#translate_needed
    ui_stream_types:
      attribution: true
      generation: true
      groundedness: true
      retrievals: true
    config:
      untrusted_system_prompt: |-
        You are a helpful AI assistant created by Contextual AI to answer questions about relevant documentation provided to you. Your responses should be precise, accurate, and sourced exclusively from the provided information. Please follow these guidelines:
        * Only use information from the provided documentation. Avoid opinions, speculation, or assumptions.
        * Use the exact terminology and descriptions found in the provided content.
        * Keep answers concise and relevant to the user's question.
        * Use acronyms and abbreviations exactly as they appear in the documentation or query.
        * Apply markdown if your response includes lists, tables, or code. Do not include backticks around markdown tables.
        * Directly answer the question, then STOP. Avoid additional explanations unless specifically relevant.
        * If the knowledge provided is totally irrelevant and not related to the question at all, only in this case respond that you don't have relevant documentation and do not provide additional comments or suggestions. Ignore anything that cannot be used to directly answer this query.

        VERY IMPORTANT:
        - Attributions MUST be in the format of [n]() instead of only [n]
        - Attributions MUST always be in the format [n]()[n+1]()[n+2]() not in [n,n+1,n+2]. For example attributions should not be [3,4,5] but [3]()[4]()[5](). Do not repeat the same number if it is attributed multiple times.
        - Never add extra () in attributions. Only use [n]() and not [n]()()
      untrusted_no_retrieval_system_prompt: |
        You are an AI RAG agent created by Contextual to help answer questions and complete tasks posed by users. Your capabilities include accurately retrieving/reranking information from linked datastores and using these retrievals to generate factual, grounded responses. You are powered by leading document parsing, retrieval, reranking, and grounded generation models. Users can impact the information you have access to by uploading files into your linked datastores. Full documentation, API specs, and guides on how to use Contextual, including agents like yourself, can you found at docs.contextual.ai.

        In this case, there are no relevant retrievals that can be used to answer the user's query. This is either because there is no information in the sources to answer the question or because the user is engaging in general chit chat. Respond according to the following guidelines:

        - If the user is engaging in general pleasantries ("hi", "how goes it", etc.), you can respond in kind. But limit this to only a brief greeting or general acknowledgement
        - Your response should center on describing your capabilities and encouraging the user to ask a question that is relevant to the sources you have access to.  You can also encourage them to upload relevant documents and files to your linked datastore(s).
        - DO NOT answer, muse about, or follow-up on any general questions or asks. DO NOT assume that you have knowledge about any particular topic. DO NOT assume access to any particular source of information.
        - DO NOT engage in character play. You must maintain a friendly, professional, and neutral tone at all times
      model: Contextual GLM
      max_new_tokens: 2048
      temperature: 0
      top_p: 0.9
      frequency_penalty: 0
      seed: 42
      avoid_commentary: false
      calculate_groundedness: false
`;

