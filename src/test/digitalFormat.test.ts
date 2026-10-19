import { describe, it, expect } from 'vitest';
import { exportToDigitalXML, importFromDigitalXML } from '../engine/storage/digitalFormat';
import { SAMPLE_CIRCUITS } from '../engine/sampleCircuits';
import { simulateCircuit } from '../engine/simulator';

describe('HNeemann Digital (.dig) Interoperability', () => {
  it('exports DE-Lab Pro Half Adder circuit to valid HNeemann .dig XML', () => {
    const halfAdder = SAMPLE_CIRCUITS.find(c => c.id === 'sample_half_adder');
    expect(halfAdder).toBeDefined();
    if (!halfAdder) return;

    const xml = exportToDigitalXML(halfAdder);
    expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(xml).toContain('<circuit>');
    expect(xml).toContain('<visualElements>');
    expect(xml).toContain('<elementName>XOr</elementName>');
    expect(xml).toContain('<elementName>And</elementName>');
    expect(xml).toContain('<elementName>In</elementName>');
    expect(xml).toContain('<elementName>Out</elementName>');
    expect(xml).toContain('<wires>');
    expect(xml).toContain('</circuit>');
  });

  it('imports HNeemann Digital XML string into functional Circuit and simulates correctly', () => {
    const sampleDigXML = `<?xml version="1.0" encoding="utf-8"?>
<circuit>
  <version>1</version>
  <attributes>
    <entry>
      <string>Description</string>
      <string>Imported AND Circuit</string>
    </entry>
  </attributes>
  <visualElements>
    <visualElement>
      <elementName>In</elementName>
      <elementAttributes>
        <entry>
          <string>Label</string>
          <string>A</string>
        </entry>
      </elementAttributes>
      <pos x="100" y="100"/>
    </visualElement>
    <visualElement>
      <elementName>In</elementName>
      <elementAttributes>
        <entry>
          <string>Label</string>
          <string>B</string>
        </entry>
      </elementAttributes>
      <pos x="100" y="200"/>
    </visualElement>
    <visualElement>
      <elementName>And</elementName>
      <pos x="250" y="140"/>
    </visualElement>
    <visualElement>
      <elementName>Out</elementName>
      <elementAttributes>
        <entry>
          <string>Label</string>
          <string>Y</string>
        </entry>
      </elementAttributes>
      <pos x="400" y="150"/>
    </visualElement>
  </visualElements>
  <wires>
    <wire>
      <p1 x="100" y="100"/>
      <p2 x="250" y="140"/>
    </wire>
    <wire>
      <p1 x="100" y="200"/>
      <p2 x="250" y="158"/>
    </wire>
    <wire>
      <p1 x="340" y="150"/>
      <p2 x="400" y="150"/>
    </wire>
  </wires>
</circuit>`;

    const res = importFromDigitalXML(sampleDigXML);
    expect(res.success).toBe(true);
    expect(res.circuit).toBeDefined();

    if (res.circuit) {
      expect(res.circuit.name).toBe('Imported AND Circuit');
      expect(res.circuit.nodes.length).toBe(4);
      expect(res.circuit.wires.length).toBeGreaterThan(0);

      // Verify simulation works on imported circuit
      const sim = simulateCircuit(res.circuit);
      expect(sim.isValid).toBe(true);
    }
  });

  it('rejects malformed XML gracefully', () => {
    const invalidXML = '<circuit><unclosed>';
    const res = importFromDigitalXML(invalidXML);
    expect(res.success).toBe(false);
    expect(res.error).toBeTruthy();
  });
});
