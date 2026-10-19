export interface ConversionStep {
  title: string;
  explanation: string;
  math: string;
}

export interface RadixConversionResult {
  binary: string;
  octal: string;
  decimal: string;
  hex: string;
  steps: ConversionStep[];
  isValid: boolean;
  errorMessage?: string;
}

export function parseNumberToDecimal(input: string, base: 2 | 8 | 10 | 16): number {
  const clean = input.trim();
  if (!clean) throw new Error('Input is empty.');

  const regexMap: Record<number, RegExp> = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^-?[0-9]+$/,
    16: /^[0-9a-fA-F]+$/,
  };

  if (!regexMap[base].test(clean)) {
    throw new Error(`Invalid characters for Base-${base} representation.`);
  }

  const parsed = parseInt(clean, base);
  if (isNaN(parsed)) {
    throw new Error('Number overflow or parse error.');
  }

  return parsed;
}

export function convertRadix(input: string, fromBase: 2 | 8 | 10 | 16): RadixConversionResult {
  try {
    const dec = parseNumberToDecimal(input, fromBase);
    const steps: ConversionStep[] = [];

    // Step 1: Base to Decimal
    if (fromBase !== 10) {
      const clean = input.trim().toUpperCase();
      const terms: string[] = [];
      let evalStr = '';
      for (let i = 0; i < clean.length; i++) {
        const digit = parseInt(clean[clean.length - 1 - i], fromBase);
        terms.push(`(${digit} × ${fromBase}^${i})`);
      }
      evalStr = terms.reverse().join(' + ');

      steps.push({
        title: `Convert Base-${fromBase} to Decimal (Base-10)`,
        explanation: `Expand digits by powers of ${fromBase}:`,
        math: `${clean}₍${fromBase}₎ = ${evalStr} = ${dec}₍₁₀₎`,
      });
    }

    // Step 2: Decimal to Binary
    const binStr = (dec >>> 0).toString(2);
    if (fromBase !== 2) {
      steps.push({
        title: 'Decimal to Binary (Base-2)',
        explanation: 'Repeated division by 2 or positional grouping:',
        math: `${dec}₍₁₀₎ = ${binStr}₍₂₎`,
      });
    }

    // Step 3: Decimal to Octal
    const octStr = (dec >>> 0).toString(8);
    if (fromBase !== 8) {
      steps.push({
        title: 'Decimal to Octal (Base-8)',
        explanation: 'Group binary into 3-bit clusters or repeated division by 8:',
        math: `${dec}₍₁₀₎ = ${octStr}₍₈₎`,
      });
    }

    // Step 4: Decimal to Hexadecimal
    const hexStr = (dec >>> 0).toString(16).toUpperCase();
    if (fromBase !== 16) {
      steps.push({
        title: 'Decimal to Hexadecimal (Base-16)',
        explanation: 'Group binary into 4-bit nibbles (0-9, A=10, B=11, C=12, D=13, E=14, F=15):',
        math: `${dec}₍₁₀₎ = 0x${hexStr}₍₁₆₎`,
      });
    }

    return {
      binary: binStr,
      octal: octStr,
      decimal: dec.toString(10),
      hex: hexStr,
      steps,
      isValid: true,
    };
  } catch (err: unknown) {
    return {
      binary: '',
      octal: '',
      decimal: '',
      hex: '',
      steps: [],
      isValid: false,
      errorMessage: err instanceof Error ? err.message : 'Conversion error',
    };
  }
}

export interface ComplementResult {
  originalDecimal: number;
  bitWidth: number;
  magnitudeBinary: string;
  onesComplement: string;
  twosComplement: string;
  signBit: 0 | 1;
  hasOverflow: boolean;
  explanation: string;
}

export function computeComplements(decimalValue: number, bitWidth: 4 | 8 | 16 = 8): ComplementResult {
  const minVal = -(1 << (bitWidth - 1));
  const maxVal = (1 << (bitWidth - 1)) - 1;

  const hasOverflow = decimalValue < minVal || decimalValue > maxVal;

  if (decimalValue >= 0) {
    const bin = (decimalValue & ((1 << bitWidth) - 1)).toString(2).padStart(bitWidth, '0');
    return {
      originalDecimal: decimalValue,
      bitWidth,
      magnitudeBinary: bin,
      onesComplement: bin,
      twosComplement: bin,
      signBit: 0,
      hasOverflow,
      explanation: `Since the value is non-negative (≥ 0), the 1's complement and 2's complement are identical to the true binary form with MSB (sign bit) = 0.`,
    };
  } else {
    // Negative number
    const absVal = Math.abs(decimalValue);
    const posBin = (absVal & ((1 << bitWidth) - 1)).toString(2).padStart(bitWidth, '0');

    // 1's complement: invert all bits
    const onesComp = posBin.split('').map(b => (b === '0' ? '1' : '0')).join('');

    // 2's complement: add 1 to 1's complement
    const twosCompInt = (parseInt(onesComp, 2) + 1) & ((1 << bitWidth) - 1);
    const twosComp = twosCompInt.toString(2).padStart(bitWidth, '0');

    return {
      originalDecimal: decimalValue,
      bitWidth,
      magnitudeBinary: posBin,
      onesComplement: onesComp,
      twosComplement: twosComp,
      signBit: 1,
      hasOverflow,
      explanation: `For negative number (${decimalValue}):\n1. True magnitude: ${posBin}\n2. 1's Complement (invert bits): ${onesComp}\n3. 2's Complement (+ 1): ${twosComp}\nMSB is 1 indicating negative polarity.`,
    };
  }
}

export interface BinaryAdditionResult {
  sumBinary: string;
  sumDecimal: number;
  carries: string;
  hasCarryOut: boolean;
}

export function addBinary(binA: string, binB: string): BinaryAdditionResult {
  const maxLen = Math.max(binA.length, binB.length);
  const a = binA.padStart(maxLen, '0');
  const b = binB.padStart(maxLen, '0');

  let carry = 0;
  const sumChars: string[] = [];
  const carryChars: string[] = [];

  for (let i = maxLen - 1; i >= 0; i--) {
    const bitA = parseInt(a[i], 10);
    const bitB = parseInt(b[i], 10);
    const total = bitA + bitB + carry;

    sumChars.unshift((total % 2).toString());
    carry = Math.floor(total / 2);
    carryChars.unshift(carry.toString());
  }

  if (carry > 0) {
    sumChars.unshift('1');
  }

  const sumBinary = sumChars.join('');
  return {
    sumBinary,
    sumDecimal: parseInt(sumBinary, 2),
    carries: carryChars.join(''),
    hasCarryOut: carry > 0,
  };
}
