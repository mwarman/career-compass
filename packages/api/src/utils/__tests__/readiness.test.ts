/**
 * Unit tests for readiness utility.
 * Tests parsing and stripping of readiness blocks from Bedrock responses.
 */

import { describe, it, expect } from 'vitest';

import { parseReadiness } from '../readiness';

describe('parseReadiness utility', () => {
  describe('AC-01: parseReadiness() utility implementation', () => {
    it('should return object with cleanedMessage and ready properties', () => {
      const response = 'Here is my response <readiness>true</readiness>';
      const result = parseReadiness(response);

      expect(result).toHaveProperty('cleanedMessage');
      expect(result).toHaveProperty('ready');
      expect(typeof result.cleanedMessage).toBe('string');
      expect(typeof result.ready).toBe('boolean');
    });

    it('should parse present readiness block (true)', () => {
      const response = 'I think you are ready <readiness>true</readiness> to proceed';
      const result = parseReadiness(response);

      expect(result.ready).toBe(true);
    });

    it('should parse present readiness block (false)', () => {
      const response = 'You need more time <readiness>false</readiness> before we continue';
      const result = parseReadiness(response);

      expect(result.ready).toBe(false);
    });
  });

  describe('AC-02: Defensive handling of missing readiness block', () => {
    it('should default ready to false when no readiness block is present', () => {
      const response = 'This is a normal response without any readiness block';
      const result = parseReadiness(response);

      expect(result.ready).toBe(false);
    });

    it('should return false (not undefined) for missing block', () => {
      const response = 'Another response with no special XML';
      const result = parseReadiness(response);

      expect(result.ready).toBe(false);
      expect(result.ready).not.toBeUndefined();
    });
  });

  describe('AC-03: cleanedMessage contains no readiness XML', () => {
    it('should strip readiness block from cleanedMessage (true)', () => {
      const response = 'Check this out <readiness>true</readiness> please';
      const result = parseReadiness(response);

      expect(result.cleanedMessage).not.toContain('<readiness>');
      expect(result.cleanedMessage).not.toContain('</readiness>');
      expect(result.cleanedMessage).toBe('Check this out please');
    });

    it('should strip readiness block from cleanedMessage (false)', () => {
      const response = 'More analysis <readiness>false</readiness> needed';
      const result = parseReadiness(response);

      expect(result.cleanedMessage).not.toContain('<readiness>');
      expect(result.cleanedMessage).not.toContain('</readiness>');
      expect(result.cleanedMessage).toBe('More analysis needed');
    });

    it('should not strip unrelated XML-like content', () => {
      const response = 'Use <xml>format</xml> for data <readiness>true</readiness> here';
      const result = parseReadiness(response);

      expect(result.cleanedMessage).toContain('<xml>format</xml>');
      expect(result.cleanedMessage).not.toContain('<readiness>');
      expect(result.cleanedMessage).toBe('Use <xml>format</xml> for data here');
    });

    it('should trim whitespace after stripping readiness block', () => {
      const response = 'Response content<readiness>true</readiness>   ';
      const result = parseReadiness(response);

      expect(result.cleanedMessage).toBe('Response content');
    });

    it('should handle readiness block at the start of message', () => {
      const response = '<readiness>true</readiness> Now we can proceed';
      const result = parseReadiness(response);

      expect(result.cleanedMessage).toBe('Now we can proceed');
      expect(result.ready).toBe(true);
    });

    it('should handle readiness block at the end of message', () => {
      const response = 'We are ready to go <readiness>true</readiness>';
      const result = parseReadiness(response);

      expect(result.cleanedMessage).toBe('We are ready to go');
      expect(result.ready).toBe(true);
    });

    it('should handle readiness block in the middle of message', () => {
      const response = 'Part one <readiness>false</readiness> part two';
      const result = parseReadiness(response);

      expect(result.cleanedMessage).toBe('Part one part two');
      expect(result.ready).toBe(false);
    });
  });

  describe('Edge cases and robustness', () => {
    it('should handle empty string', () => {
      const result = parseReadiness('');

      expect(result.ready).toBe(false);
      expect(result.cleanedMessage).toBe('');
    });

    it('should handle message with only whitespace', () => {
      const result = parseReadiness('   ');

      expect(result.ready).toBe(false);
      expect(result.cleanedMessage).toBe('');
    });

    it('should handle multiple readiness blocks (should strip all)', () => {
      // Note: While unusual, the code uses global replace so it handles multiple blocks
      const response = 'Start <readiness>true</readiness> middle <readiness>false</readiness> end';
      const result = parseReadiness(response);

      // The last match in the regex determines the ready value
      // But with global replace, both blocks are stripped
      expect(result.cleanedMessage).not.toContain('<readiness>');
      expect(result.cleanedMessage).toBe('Start middle end');
    });

    it('should not match malformed readiness blocks', () => {
      const response = 'Check <readiness>maybe</readiness> this';
      const result = parseReadiness(response);

      // 'maybe' is not 'true' or 'false', so it should not match and default to false
      expect(result.ready).toBe(false);
      // The malformed block should not be stripped
      expect(result.cleanedMessage).toContain('<readiness>maybe</readiness>');
    });

    it('should handle case-sensitive readiness values (true/false only)', () => {
      const trueResponse = 'Response <readiness>TRUE</readiness> test';
      const falseResponse = 'Response <readiness>FALSE</readiness> test';
      const lowerTrueResponse = 'Response <readiness>true</readiness> test';
      const lowerFalseResponse = 'Response <readiness>false</readiness> test';

      expect(parseReadiness(trueResponse).ready).toBe(false); // TRUE !== true
      expect(parseReadiness(falseResponse).ready).toBe(false); // FALSE !== false
      expect(parseReadiness(lowerTrueResponse).ready).toBe(true); // true === true
      expect(parseReadiness(lowerFalseResponse).ready).toBe(false); // false === false
    });

    it('should handle multiline content', () => {
      const response = `This is a multi-line response
with some content <readiness>true</readiness>
and more content here`;
      const result = parseReadiness(response);

      expect(result.ready).toBe(true);
      expect(result.cleanedMessage).not.toContain('<readiness>');
      expect(result.cleanedMessage).toContain('multi-line');
      expect(result.cleanedMessage).toContain('and more content');
    });
  });
});
