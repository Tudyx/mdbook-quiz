import classNames from "classnames";
import _ from "lodash";
import React, { useState } from "react";

import { MoreInfo } from "../components/more-info";
import { Snippet } from "../components/snippet";
import { QuestionFields, QuestionMethods } from "./types";

export interface TracingPrompt {
  /** The contents of the program to trace */
  program: string;
}

export interface TracingAnswer {
  /** True if the program should pass the compiler */
  doesCompile: boolean;

  /** If doesCompile=true, then the contents of stdout after running the program */
  stdout?: string;

  /** If doesCompile=false, then the line number of the code causing the error */
  lineNumber?: number;
}

export type Tracing = QuestionFields<"Tracing", TracingPrompt, TracingAnswer>;

let HELP_TEXT = `Errors may involve multiple line numbers. For example:

\`\`\`
let mut x = 1;
let y = &x;
let z = &mut x;
*z = *y;
\`\`\`

Here, lines 2, 3, and 4 all interact to cause a compiler error. 
To resolve this ambiguity, you should mark the _last_ line which is involved in the error. 
Here, that would be line 4. (Since without line 4, this program would compile!)
`;

export let TracingMethods: QuestionMethods<TracingPrompt, TracingAnswer> = {
  PromptView: ({ prompt }) => (
    <>
      <p>
        Determine whether the program will pass the compiler. If it passes, write the expected
        output of the program if it were executed. If the program does not pass, indicate the last
        line number involved in the compiler error.
      </p>
      <Snippet snippet={prompt.program} />
    </>
  ),

  ResponseView: ({
    prompt,
    formValidators: {
      required,
      formState: { errors },
    },
  }) => {
    let [doesCompile, setDoesCompile] = useState<boolean | undefined>(undefined);
    let lineNumbers = _.range(prompt.program.trim().split("\n").length).map(i => i + 1);
    return (
      <>
        <div className="response-block">
          This program:{" "}
          <span className={classNames("option", { error: errors.doesCompile })}>
            <input
              type="radio"
              {...required("doesCompile")}
              id="doesCompileTrue"
              value="true"
              onClick={() => setDoesCompile(true)}
            />{" "}
            <label htmlFor="doesCompileTrue">DOES compile</label>
          </span>
          <span className="option-separator">OR</span>
          <span className={classNames("option", { error: errors.doesCompile })}>
            <input
              type="radio"
              {...required("doesCompile")}
              id="doesCompileFalse"
              value="false"
              onClick={() => setDoesCompile(false)}
            />{" "}
            <label htmlFor="doesCompileFalse">does NOT compile</label>
          </span>
        </div>

        {doesCompile !== undefined ? (
          doesCompile ? (
            <div>
              <p>The output of this program will be:</p>
              <textarea
                {...required("stdout")}
                placeholder="Write the program's stdout here..."
              ></textarea>
            </div>
          ) : (
            <div>
              <p>
                The error occurs on the line number:{" "}
                <select {...required("lineNumber")}>
                  <option value="">Select...</option>
                  {lineNumbers.map((n, i) => (
                    <option key={i} value={n}>
                      Line {n}
                    </option>
                  ))}
                </select>
                &nbsp;&nbsp;
                <MoreInfo markdown={HELP_TEXT} />
              </p>
            </div>
          )
        ) : null}
      </>
    );
  },

  getAnswerFromDOM(data) {
    let doesCompile = data.doesCompile === "true";
    if (doesCompile) {
      let stdout = data.stdout;
      return { doesCompile, stdout };
    } else {
      let lineNumber = parseInt(data.lineNumber);
      return { doesCompile, lineNumber };
    }
  },

  AnswerView: ({ answer, baseline }) => {
    let correctnessClass = (key: keyof TracingAnswer) =>
      answer[key] == baseline[key] ? "correct" : "incorrect";
    return (
      <div>
        <p className={correctnessClass("doesCompile")}>
          This program <strong>{answer.doesCompile ? "does" : "does not"}</strong> compile.
        </p>
        {answer.doesCompile ? (
          <>
            <p className={correctnessClass("stdout")}>The output of this program will be:</p>
            <pre>{answer.stdout}</pre>
          </>
        ) : (
          <p className={correctnessClass("lineNumber")}>
            The error occurs on the line number: <code>{answer.lineNumber}</code>
          </p>
        )}
      </div>
    );
  },
};
