class UnitExplanationReporter {
    onTestCaseResult(testCase) {
        const result = testCase.result();
        const diagnostic = testCase.diagnostic?.();
        const status = (result?.state || "unknown").toUpperCase();
        const duration = diagnostic?.duration != null ? `${diagnostic.duration}ms` : "n/a";
        const expected = `The scenario "${testCase.name}" should satisfy all assertions and finish successfully.`;
        const actual = result?.state === "passed"
            ? `PASS - observed behavior matched every assertion.`
            : `FAIL - ${result?.errors?.[0]?.message || "see failure details above."}`;

        console.info(
            [
                "",
                `[UNIT] ${testCase.fullName}`,
                `Explanation: ${testCase.name}`,
                `Expected: ${expected}`,
                `Actual: ${actual}`,
                `Status: ${status}`,
                `Duration: ${duration}`
            ].join("\n")
        );
    }
}

module.exports = UnitExplanationReporter;
