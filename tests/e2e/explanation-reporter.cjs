class E2EExplanationReporter {
    onTestEnd(test, result) {
        const fullName = test.titlePath().slice(1).join(" > ");
        const expected = `The flow "${test.title}" should complete with every browser assertion passing.`;
        const actual = result.status === "passed"
            ? "PASS - the browser matched the expected UI and persistence behavior."
            : `FAIL - ${result.error?.message || "see failure details above."}`;

        console.info(
            [
                "",
                `[E2E] ${fullName}`,
                `Explanation: ${test.title}`,
                `Expected: ${expected}`,
                `Actual: ${actual}`,
                `Status: ${result.status.toUpperCase()}`,
                `Duration: ${result.duration}ms`,
                `Retry: ${result.retry}`
            ].join("\n")
        );
    }
}

module.exports = E2EExplanationReporter;
