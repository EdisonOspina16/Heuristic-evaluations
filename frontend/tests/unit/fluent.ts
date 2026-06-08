export class FluentAssertion<T> {
  constructor(private readonly actual: T) {}

  shouldEqual(expected: T) {
    expect(this.actual).toEqual(expected);
    return this;
  }

  shouldBe(expected: T) {
    expect(this.actual).toBe(expected);
    return this;
  }

  shouldContain(expected: unknown) {
    expect(this.actual).toContain(expected);
    return this;
  }

  shouldBeInTheDocument() {
    expect(this.actual).toBeInTheDocument();
    return this;
  }

  shouldHaveBeenCalledWith(...expected: unknown[]) {
    expect(this.actual).toHaveBeenCalledWith(...expected);
    return this;
  }

  shouldHaveLength(expected: number) {
    expect(this.actual).toHaveLength(expected);
    return this;
  }
}

export function expectThat<T>(actual: T) {
  return new FluentAssertion(actual);
}
