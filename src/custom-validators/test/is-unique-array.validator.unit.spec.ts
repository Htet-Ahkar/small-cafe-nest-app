import { validate } from 'class-validator';
import { IsUniqueArray } from '../is-unique-array.validator';

class TestDto {
  @IsUniqueArray({ message: 'Array contains duplicate values' })
  values: number[];
}

describe('IsUniqueArrayValidator', () => {
  it('should pass when array has unique values', async () => {
    const dto = new TestDto();
    dto.values = [1, 2, 3];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when array contains duplicates', async () => {
    const dto = new TestDto();
    dto.values = [1, 2, 2, 3];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.IsUniqueArray).toBe(
      'Array contains duplicate values',
    );
  });

  it('should fail when value is not an array', async () => {
    const dto = new TestDto();
    // @ts-ignore - We intentionally assign an invalid value to test validation
    dto.values = 'not an array';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with an empty array', async () => {
    const dto = new TestDto();
    dto.values = [];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
