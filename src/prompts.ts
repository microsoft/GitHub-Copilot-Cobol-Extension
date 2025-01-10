export const systemPrompt =
  "You are a usefull Assistant that helps to generate docs for COBOL code, do not add code samples.";

export const headerInfoPrompt = `
    Write an explanation for the COBOL program using the IDENTIFICATION DIVISION, ENVIRONMENT DIVISION and comments 
    Start directly with program name
    All dates should be in the format YYYY-MM-DD
    Identify the author and if exists add it to the explanation
    Identify the date and if exists add it to the explanation
    Identify the version if exists and add it to the explanation
    Identify the release if exists histroy and add it to the explanation
    Identify the description using also comments and add it to the explanation
    Identify the environment information and add it to the explanation
    Do not insert code inside explanation
    Do not generate or add examples
    Do not add consideration or comments

    this is an example of a full complete explanation should look like:
    **Program Name** 
    program_name
    **Author** 
    author_name
    **Version** 
    version_number
    **Date** 
    release_date
    **Release history** 
    - release_date: release_description
    **Description** 
    program_description
    **Environment Information** 
    environment_information
    

    Below is the code, do not add it to output:

    ### CODE
    \n  {{code}}
    ### END CODE
    `;

export const procedureSectionPrompt = `
    Write an explanation for the active selection as paragraphs of text
    Begin directly with a summary for the section {{paragraph_name}}
    Start the summary with "The section ... " and add a brief explanation of the code purpose
    After the summary provide detailed explanation  for each step in the code in a paragraph named "Step by Step Flow"
    Identify external calls (CALL PROGRAM) 
    if you identify one or more external callthen add a paragraph named "External Calls" and list all call by name otherwise do not add the paragraph or use none
    Identify internal calls (PERFORM PARAGRAPH) 
    if you identify one or more internal call then add a paragraph named "Internal Calls" and list all call by name otherwise do not add the paragraph or use none
    Generate mermaid flowcahrt for the code and add it to the explanation
    add a blank line after the summary
    
    this is an example of a full complete explanation should look like:
    \n  
    ### SECTION_NAME
    The section ...
    #### Step by Step Flow
    - 1: ...
    - 2: ...
    
    ##### Diagram
    mermaid_flow_diagram

    #### External Calls
    - call_name
    #### Internal Calls
    - perform_name
    



    Below is the code, do not add it to output:

    ### CODE
    \n  {{code}}
    ### END CODE
    `;
export const dataSectionPrompt = `
    list all variables, labels and constants at all nested levels as a bullet list, for each variable , label and constant at every level and nested level add a paragrph with description and data type
    respect the hierarchy levels of the variables, labels and constants in the list and put level number in brackets after the constant and variable name like VARIABLE_NAME (level)
    do not add any title like 'Variables, Labels, and Constants...' or similar
    each bullet point should be like this:
    - **VARIABLE_NAME (LEVEL_NUMBER)**
      - Description: Variable description.
      - Data Type: Variable data type.
    If you dont find any variables, labels or constants just respond with 'none'
    Below is the code, do not add it to output:
  
    ### CODE
    \n {{code}}
    ### END CODE
    `;

export const explainCodePrompt = `
    Write an explanation for the COBOL program as paragraphs of text
    Do not insert source code inside explanation
    Do not generate or add examples
    Do not add consideration or comments
  
    Below is the code, do not add it to output:

    ### CODE
    \n  {{code}}
    ### END CODE
    `;
