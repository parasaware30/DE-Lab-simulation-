export interface QuizQuestion {
  id: string;
  category: 'Logic Gates' | 'Boolean Algebra' | 'K-Maps' | 'Combinational' | 'Sequential' | 'Number Systems';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    category: 'Logic Gates',
    difficulty: 'Beginner',
    question: 'Which of the following logic gates produces a HIGH output (1) ONLY when all of its inputs are HIGH (1)?',
    options: ['OR Gate', 'NAND Gate', 'AND Gate', 'XOR Gate'],
    correctIndex: 2,
    explanation: 'An AND gate performs logical conjunction: Y = A · B. The output is 1 if and only if all inputs are 1.',
  },
  {
    id: 'q2',
    category: 'Logic Gates',
    difficulty: 'Beginner',
    question: 'Why are NAND and NOR gates termed "Universal Gates"?',
    options: [
      'They operate faster than any other gates in silicon.',
      'Any Boolean function or logic circuit can be created using exclusively NAND or exclusively NOR gates.',
      'They have the highest noise margin in TTL logic.',
      'They accept an infinite number of input lines.'
    ],
    correctIndex: 1,
    explanation: 'NAND and NOR gates are universal because NOT, AND, and OR functions (which form a functionally complete set) can all be synthesized using only NAND or only NOR gates.',
  },
  {
    id: 'q3',
    category: 'Logic Gates',
    difficulty: 'Intermediate',
    question: 'What is the output of a 2-input XOR gate when both inputs are HIGH (1)?',
    options: ['HIGH (1)', 'LOW (0)', 'High-Z (Floating)', 'Oscillating'],
    correctIndex: 1,
    explanation: 'The XOR (exclusive OR) gate evaluates to HIGH only when the inputs differ. When A = 1 and B = 1, Y = 1 ⊕ 1 = 0.',
  },
  {
    id: 'q4',
    category: 'Boolean Algebra',
    difficulty: 'Beginner',
    question: 'According to De Morgan\'s Theorem, the expression (A · B)\' is equivalent to:',
    options: ['A\' · B\'', 'A\' + B\'', '(A + B)\'', 'A + B'],
    correctIndex: 1,
    explanation: 'De Morgan\'s first theorem states that the complement of a product of variables is equal to the sum of their individual complements: (A · B)\' = A\' + B\'.',
  },
  {
    id: 'q5',
    category: 'Boolean Algebra',
    difficulty: 'Intermediate',
    question: 'Which Boolean law simplifies the expression: A + A\'B ?',
    options: ['Identity Law: A', 'Absorption / Redundancy Rule: A + B', 'De Morgan\'s Law: A\'B\'', 'Consensus Theorem: AB'],
    correctIndex: 1,
    explanation: 'Using the distributive property: A + A\'B = (A + A\')(A + B) = (1)(A + B) = A + B.',
  },
  {
    id: 'q6',
    category: 'Boolean Algebra',
    difficulty: 'Intermediate',
    question: 'What is the simplified form of A + AB ?',
    options: ['B', 'A', 'A + B', '1'],
    correctIndex: 1,
    explanation: 'By the Absorption Law: A + AB = A(1 + B) = A(1) = A.',
  },
  {
    id: 'q7',
    category: 'K-Maps',
    difficulty: 'Beginner',
    question: 'Why are the cell rows and columns of a Karnaugh Map arranged in Gray code order (00, 01, 11, 10)?',
    options: [
      'It speeds up computer memory addressing.',
      'Adjacent cells differ by exactly one binary variable, allowing terms differing by a literal to combine (AB + AB\' = A).',
      'It sorts minterms in strictly ascending decimal order.',
      'To prevent race conditions in hardware decoders.'
    ],
    correctIndex: 1,
    explanation: 'Gray code ensures that adjacent physical cells differ in only a single bit, enabling algebraic absorption between adjacent cells.',
  },
  {
    id: 'q8',
    category: 'K-Maps',
    difficulty: 'Intermediate',
    question: 'How many cells are grouped together in a 4-variable K-Map to eliminate 3 variables from the resulting product term?',
    options: ['2 cells', '4 cells', '8 cells', '16 cells'],
    correctIndex: 2,
    explanation: 'A group of 2^k cells in an n-variable K-Map eliminates k variables. To eliminate 3 variables, we need 2^3 = 8 cells.',
  },
  {
    id: 'q9',
    category: 'Combinational',
    difficulty: 'Beginner',
    question: 'What are the Boolean expressions for the Sum and Carry of a Half Adder with inputs A and B?',
    options: [
      'Sum = A + B, Carry = A · B',
      'Sum = A ⊕ B, Carry = A · B',
      'Sum = A · B, Carry = A ⊕ B',
      'Sum = (A · B)\', Carry = A + B'
    ],
    correctIndex: 1,
    explanation: 'A Half Adder produces Sum = A ⊕ B (binary addition without carry-in) and Carry = A · B.',
  },
  {
    id: 'q10',
    category: 'Combinational',
    difficulty: 'Intermediate',
    question: 'How many select lines are required for a 16-to-1 Multiplexer?',
    options: ['2', '3', '4', '8'],
    correctIndex: 2,
    explanation: 'For 2^n inputs, n select lines are required. Since 16 = 2^4, 4 select lines are required.',
  },
  {
    id: 'q11',
    category: 'Combinational',
    difficulty: 'Advanced',
    question: 'How many 2-to-4 decoders with an enable pin are needed to construct a 3-to-8 decoder?',
    options: ['1', '2 and 1 inverter', '4 and 1 AND gate', '8'],
    correctIndex: 1,
    explanation: 'Two 2-to-4 decoders are used. The highest-order address bit is connected directly to the Enable of one decoder and inverted to the Enable of the other.',
  },
  {
    id: 'q12',
    category: 'Sequential',
    difficulty: 'Beginner',
    question: 'What is the primary difference between a combinational circuit and a sequential circuit?',
    options: [
      'Combinational circuits contain transistors while sequential circuits do not.',
      'Sequential circuits possess memory elements and their outputs depend on past inputs as well as present inputs.',
      'Combinational circuits require a clock signal, whereas sequential circuits are unclocked.',
      'Sequential circuits cannot be described using Boolean equations.'
    ],
    correctIndex: 1,
    explanation: 'Sequential circuits incorporate memory feedback (flip-flops/latches); their output depends on the sequence of past inputs and current inputs.',
  },
  {
    id: 'q13',
    category: 'Sequential',
    difficulty: 'Intermediate',
    question: 'In an SR Flip-Flop, what condition occurs when both S = 1 and R = 1 simultaneously?',
    options: [
      'Toggle State',
      'No Change / Hold State',
      'Forbidden / Invalid Metasable State',
      'Asynchronous Reset'
    ],
    correctIndex: 2,
    explanation: 'When S=1 and R=1, both outputs Q and Q\' try to become 0 (in NOR latches) or 1 (in NAND latches), violating the complementary relation Q = Q\' and leading to indeterminacy.',
  },
  {
    id: 'q14',
    category: 'Sequential',
    difficulty: 'Intermediate',
    question: 'How does a JK Flip-Flop overcome the invalid state of the SR Flip-Flop when both inputs are HIGH?',
    options: [
      'It ignores the clock signal.',
      'It toggles the output state (Q_{n+1} = Q_n\').',
      'It forces Q to 0 unconditionally.',
      'It generates a high-impedance state.'
    ],
    correctIndex: 1,
    explanation: 'In a JK Flip-Flop, J=1 and K=1 causes the output to invert or toggle on each clock pulse.',
  },
  {
    id: 'q15',
    category: 'Sequential',
    difficulty: 'Advanced',
    question: 'How many flip-flops are required to construct a modulo-12 (MOD-12) ripple counter?',
    options: ['3', '4', '6', '12'],
    correctIndex: 1,
    explanation: 'For a MOD-N counter, 2^(n-1) < N <= 2^n. For N=12, 2^3 = 8 < 12 <= 2^4 = 16. Hence, 4 flip-flops are required.',
  },
  {
    id: 'q16',
    category: 'Number Systems',
    difficulty: 'Beginner',
    question: 'What is the binary representation of decimal 25?',
    options: ['11001', '10101', '11100', '10011'],
    correctIndex: 0,
    explanation: '25 = 16 + 8 + 1 = (1 × 2^4) + (1 × 2^3) + (0 × 2^2) + (0 × 2^1) + (1 × 2^0) = 11001_2.',
  },
  {
    id: 'q17',
    category: 'Number Systems',
    difficulty: 'Intermediate',
    question: 'What is the 2\'s complement of the 8-bit binary number 00010100 (decimal +20)?',
    options: ['11101011', '11101100', '11010100', '00010101'],
    correctIndex: 1,
    explanation: '1\'s complement of 00010100 is 11101011. Adding 1 yields 11101100, which represents -20 in 8-bit signed two\'s complement.',
  },
  {
    id: 'q18',
    category: 'Number Systems',
    difficulty: 'Beginner',
    question: 'What is the hexadecimal equivalent of binary 11011010_2?',
    options: ['DA', 'DB', 'CD', 'D9'],
    correctIndex: 0,
    explanation: 'Group into 4-bit nibbles: 1101_2 = 13 = D, and 1010_2 = 10 = A. Thus, 11011010_2 = 0xDA.',
  },
];
