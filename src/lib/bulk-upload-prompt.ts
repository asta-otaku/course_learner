export const getBulkUploadPrompt = (config?: {
  subject?: string
  grade?: string
  questionTypes?: string[]
  count?: number
  topic?: string
  questionFormat?: string
  hintStyle?: string
  correctFeedbackStyle?: string
  incorrectFeedbackStyle?: string
  defaultTimeLimit?: string
}) => {
  const {
    subject = 'Mathematics',
    grade = 'Year Three',
    questionTypes = ['multiple_choice', 'true_false', 'free_text'],
    count = 20,
    topic = '',
    questionFormat = 'standard',
    hintStyle = 'helpful',
    correctFeedbackStyle = 'encouraging',
    incorrectFeedbackStyle = 'constructive',
    defaultTimeLimit = 'none'
  } = config || {}

  // Calculate distribution
  const typeCount = questionTypes.length
  const baseCount = Math.floor(count / typeCount)
  const remainder = count % typeCount
  
  const distribution = questionTypes.map((type, index) => {
    const typeCount = baseCount + (index < remainder ? 1 : 0)
    const typeLabel = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    return `- ${typeLabel}: ${typeCount} questions`
  }).join('\n')

  const timeValue = defaultTimeLimit === 'none' ? '' : defaultTimeLimit

  const prompt = `# STRICT CSV GENERATION INSTRUCTIONS

Generate exactly ${count} ${subject} questions for ${grade} students.
${topic ? `Topic Focus: ${topic}` : 'Mixed topics within the subject'}

Distribution:
${distribution}

## CRITICAL: USE THESE EXACT TEMPLATES

You MUST follow these templates EXACTLY. Only change the content, subject matter, and values - NEVER change the structure, field count, or format.

### HEADER ROW (copy exactly):
\`\`\`
content,type,time_limit,hint,is_public,image_url,correct_feedback,incorrect_feedback,answer_1,answer_1_correct,answer_2,answer_2_correct,answer_3,answer_3_correct,answer_4,answer_4_correct,answer_5,answer_5_correct,answer_6,answer_6_correct,answer_7,answer_7_correct,answer_8,answer_8_correct,accepted_answers,grading_criteria,match_pairs
\`\`\`

### TEMPLATE 1: Multiple Choice (copy structure exactly)
\`\`\`
What is the capital of France?,multiple_choice,60,It's known as the City of Light,true,,Great job! You know your European capitals. Paris is the capital and largest city of France.,Not quite. Review European geography. The correct answer is Paris.,London,false,Paris,true,Berlin,false,Madrid,false,,,,,,,,,
\`\`\`

**Multiple Choice Rules:**
- Change ONLY: question content, hint, feedback, answer options
- Keep structure: 4 answers shown, then 8 empty fields (,,,,,,,), then 3 empty fields (,,)
- Set exactly ONE answer_X_correct to \`true\`, others to \`false\`
- Use \`${timeValue}\` for time_limit or leave empty
- End with: \`,,,,,,,,,,,\` (11 commas for empty fields)

### TEMPLATE 2: True/False (copy structure exactly)
\`\`\`
The Earth is flat.,true_false,30,Think about what astronauts see from space,true,,Correct! The Earth is indeed spherical as proven by numerous scientific observations.,Remember the Earth is a sphere not flat. This has been proven through various scientific methods.,True,false,False,true,,,,,,,,,,,,,,,
\`\`\`

**True/False Rules:**
- Change ONLY: question content, hint, feedback
- Keep structure: True,false,False,true, then 12 empty fields (,,,,,,,,,,,,), then 3 empty fields (,,)
- Always use: \`True,false,False,true\` or \`True,true,False,false\` 
- Use \`${timeValue}\` for time_limit or leave empty
- End with: \`,,,,,,,,,,,,,,,\` (15 commas for empty fields)

### TEMPLATE 3: Free Text (copy structure exactly)
\`\`\`
What is the chemical symbol for water?,free_text,30,It contains hydrogen and oxygen,true,,Correct! You know your chemistry. Water is composed of two hydrogen atoms and one oxygen atom.,Try again. Think about the elements in water. The correct answer is H2O.,,,,,,,,,,,,,,,,,H2O | H₂O | water,Accept H2O with or without subscript formatting,
\`\`\`

**Free Text Rules:**
- Change ONLY: question content, hint, feedback, accepted_answers, grading_criteria
- Keep structure: 16 empty answer fields (,,,,,,,,,,,,,,,,), then accepted_answers, grading_criteria, empty match_pairs
- MUST fill accepted_answers: use format \`answer1 | answer2 | answer3\`
- Use \`${timeValue}\` for time_limit or leave empty
- End with: \`,Accept [criteria],\` (accepted_answers, grading_criteria, empty match_pairs)

### TEMPLATE 4: Matching (copy structure exactly)
\`\`\`
Match the country with its capital city.,matching,120,Think about major world capitals,true,,Well done! You matched all the capitals correctly. These are some of the most well-known capital cities in the world.,Review world geography and try again. Take your time to think about each country.,,,,,,,,,,,,,,,,,,,Japan|Tokyo;Italy|Rome;Brazil|Brasília;Canada|Ottawa
\`\`\`

**Matching Rules:**
- Change ONLY: question content, hint, feedback, match_pairs
- Keep structure: 16 empty answer fields (,,,,,,,,,,,,,,,,), then 2 empty fields (,,), then match_pairs
- MUST fill match_pairs: use format \`Left1|Right1;Left2|Right2;Left3|Right3\`
- Use \`${timeValue}\` for time_limit or leave empty
- Maximum 8 matching pairs allowed
- End with: \`,,Left1|Right1;Left2|Right2;Left3|Right3\` (empty accepted_answers, empty grading_criteria, filled match_pairs)

## FIELD-BY-FIELD SPECIFICATIONS:

1. **content**: Your ${subject} question for ${grade} students
2. **type**: EXACTLY \`multiple_choice\`, \`true_false\`, \`free_text\`, or \`matching\`
3. **time_limit**: \`${timeValue}\` or empty
4. **hint**: ${getHintStyleDescription(hintStyle)}
5. **is_public**: Always \`true\`
6. **image_url**: Empty (just \`,\`)
7. **correct_feedback**: ${getCorrectFeedbackDescription(correctFeedbackStyle)}
8. **incorrect_feedback**: ${getIncorrectFeedbackDescription(incorrectFeedbackStyle)}
9-24. **answer_1 through answer_8_correct**: Use template patterns exactly
25. **accepted_answers**: For free_text ONLY - pipe separated answers
26. **grading_criteria**: For free_text ONLY - grading instructions  
27. **match_pairs**: For matching ONLY - Left|Right;Left|Right format

## GENERATION INSTRUCTIONS:

1. **Start with the header row** (copy exactly from template)
2. **For each question:**
   - Choose question type from your distribution
   - Copy the corresponding template structure EXACTLY
   - Replace ONLY the content fields (question, hints, feedback, answers)
   - Keep ALL structural elements (commas, empty fields, field order)
   - Verify 27 fields total (26 commas)

## QUALITY REQUIREMENTS:

**Content Guidelines:**
- Age-appropriate for ${grade}
- Clear, unambiguous wording  
- ${topic ? `Focus on: ${topic}` : 'Cover diverse topics'}
- Mathematical expressions can use LaTeX: \$x^2 + 5\$ for inline or \$\$\\frac{a}{b}\$\$ for display

**Validation Checklist:**
- [ ] Header row copied exactly
- [ ] Each data row has exactly 27 fields (26 commas)
- [ ] All \`type\` values are valid
- [ ] All free_text questions have filled \`accepted_answers\`
- [ ] All matching questions have filled \`match_pairs\` (max 8 pairs)
- [ ] Multiple choice has exactly one \`true\` answer
- [ ] Multiple choice has maximum 8 answer options
- [ ] True/false follows template pattern
- [ ] All boolean values are lowercase \`true\`/\`false\`

## CRITICAL REMINDERS:

🚨 **COPY THE TEMPLATES EXACTLY** - only change content, never structure
🚨 **COUNT YOUR COMMAS** - must be exactly 26 per row
🚨 **REQUIRED FIELDS** - accepted_answers for free_text, match_pairs for matching
🚨 **NO STRUCTURAL CHANGES** - follow templates character-for-character for commas and empty fields

Generate exactly ${count} questions using these templates. Output only CSV data starting with the header row.`

  return prompt
}

// Helper functions for style descriptions
function getHintStyleDescription(style: string): string {
  switch (style) {
    case 'scaffolded': return 'Step-by-step hints building understanding'
    case 'conceptual': return 'Conceptual hints focusing on underlying principles'
    case 'minimal': return 'Brief, minimal hints'
    case 'none': return 'Leave empty'
    default: return 'Helpful hints guiding toward solution'
  }
}

function getCorrectFeedbackDescription(style: string): string {
  switch (style) {
    case 'explanatory': return 'Explain why the answer is correct and the reasoning'
    case 'next-steps': return 'Positive feedback with suggestions for next learning'
    case 'brief': return 'Brief acknowledgment of correct answer'
    default: return 'Encouraging positive reinforcement with explanation'
  }
}

function getIncorrectFeedbackDescription(style: string): string {
  switch (style) {
    case 'explanatory': return 'Explain the mistake and correct reasoning'
    case 'hints': return 'Provide hints to help student retry'
    case 'solution': return 'Show correct answer with detailed explanation'
    default: return 'Constructive feedback guiding to correct answer'
  }
}

export const getPromptForClipboard = () => {
  return getBulkUploadPrompt({
    subject: 'Mathematics',
    grade: 'Year Three',
    questionTypes: ['multiple_choice', 'true_false', 'free_text'], // Matching excluded by default
    count: 20
  })
}
