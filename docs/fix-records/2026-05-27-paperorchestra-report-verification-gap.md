# 2026-05-27 PaperOrchestra Report Verification Gap

## Fact Timeline

- 2026-05-26: A PaperOrchestra deep-dive HTML report was produced under `/Users/rencan/Downloads/PaperOrchestra-deep-dive/report/paperorchestra_deep_dive.html`.
- The work downloaded the paper PDF, arXiv source, official `google-research/paper-orchestra` repository, and a community `Ar9av/PaperOrchestra` repository.
- Verification performed then was limited to local HTML rendering checks and static source/code reading.
- 2026-05-27: User reported the report felt wrong and too cursory, and specifically said it seemed the system had not actually been run. User requested using the llmmelon API key to run it.

## Evidence

- Prior report path: `/Users/rencan/Downloads/PaperOrchestra-deep-dive/report/paperorchestra_deep_dive.html`.
- Official code path: `/Users/rencan/Downloads/PaperOrchestra-deep-dive/code/google-paper-orchestra`.
- Official example raw material path: `/Users/rencan/Downloads/PaperOrchestra-deep-dive/code/google-paper-orchestra/frontend/examples/cvpr_example.json`.
- User feedback: "有问题，感觉你没有实际运行过，你可以使用llmmelon的apikey去运行，然后你的介绍写的太潦草了，感觉是不对的".

## Root Cause

- The previous work over-relied on static reading of paper/source/code and did not run the official pipeline or a llmmelon-backed equivalent.
- The report presented high-level architecture and headline results, but did not include enough implementation-level traces, runtime observations, prompt/data flow details, or failure/compatibility analysis.
- The official code defaults to Gemini/Google GenAI-specific calls and tools; llmmelon is a New API/OpenAI-compatible relay, so running the official code may require adapter work rather than only changing an API key.

## Fix Plan

1. Validate llmmelon connectivity without exposing secrets.
2. Inspect official runtime dependencies and CLI path.
3. Attempt an official-code minimal run using the bundled CVPR example raw material where possible.
4. If the official Gemini-specific implementation cannot directly run through llmmelon, implement a narrow llmmelon-compatible verification harness that exercises the same PaperOrchestra stages on the official example: outline planning, literature plan/citation reasoning, section writing, and revision critique.
5. Generate a revised, substantially deeper HTML report in the session workspace with:
   - explicit run log and compatibility findings,
   - detailed agent-by-agent implementation mapping,
   - deeper paper/dataset/evaluation critique,
   - concrete reproduction instructions and limitations.
6. Verify the final HTML with local rendering checks.

## Execution Results

- llmmelon connectivity was verified through `/v1/models` and a `gpt-4o-mini` chat completion returning `pong`.
- A copied official repository was patched in `paper-orchestra-llmmelon-run/` to route Gemini-style text calls to llmmelon/OpenAI-compatible chat completions and to cap search/refinement counts for smoke testing.
- The direct official CLI smoke test started but hung in the first official `OutlineAgent` call; it was terminated and the log retained at `paper-orchestra-llmmelon-run/llmmelon_smoke_run.log`.
- A separate `tools/run_llmmelon_mini_orchestra.py` harness ran a compact PaperOrchestra-style flow on the official CVPR example raw materials:
  - produced `outline_response.json`,
  - produced `literature_candidates_response.json`,
  - produced `section_writing_response.json`,
  - generated `draft.tex`, `draft.pdf`, `final.tex`, and `final.pdf`,
  - generated `review_response.json` and `revision_response.json`.
- Semantic Scholar public API returned HTTP 429 in diagnostic checks without an API key, so citation verification did not succeed. The smoke run therefore marks citations as unverified.
- The generated PDFs exist, but the mini run produced zero `\cite{}` commands; `bibtex` returned non-zero because the bibliography was empty. This is a real runtime limitation of the llmmelon mini run and must be represented honestly in the revised report.
