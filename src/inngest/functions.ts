import {inngest} from "./client";
import {createAgent, createTool, openai, createNetwork,} from "@inngest/agent-kit";
import {Sandbox} from "@e2b/code-interpreter";
import {getSandbox, lastAssistantTextMessageContent} from "@/lib/utils";
import {PROMPT} from "@/prompt";
import * as z from "zod";

const TerminalSchema = z.object({
    command: z.string(),
});

const ReadFileSchema = z.object({
    files: z.array(z.string()),
})

export const helloWorld = inngest.createFunction(
    {id: "hello-world"},
    {event: "test/hello.world"},
    async ({event, step}) => {
        const sandboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create("xyx-next");
            return sandbox.sandboxId;
        });
        const codeAgent = createAgent({
            name: "code-agent",
            description: "An expert coding agent.",
            system: PROMPT,
            model: openai({
                model: "gpt-4.1",
                defaultParameters: {
                    temperature: 0.1,
                },
                apiKey: process.env.OPENAI_API_KEY
            }),
            tools: [
                createTool({
                    name: "terminal",
                    description: "Use the terminal to run commands",
                    parameters: TerminalSchema,
                    handler: async ({command}, {step}) => {
                        return await step?.run("terminal", async () => {
                            const buffers = {stdout: "", stderr: ""};
                            try {
                                const sandbox = await getSandbox(sandboxId);
                                const result = await sandbox.commands.run(command, {
                                    onStdout: (data: string) => {
                                        buffers.stdout += data;
                                    },
                                    onStderr: (data: string) => {
                                        buffers.stderr += data;
                                    }
                                });
                                return result.stdout;
                            } catch (error) {
                                console.error(`Command failed ${error} \n`);
                                return `Command failed: ${error}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
                            }
                        })
                    },
                }),
                createTool({
                    name: "readFiles",
                    description: "Read files from the sand",
                    parameters: ReadFileSchema,
                    handler: async ({files}, {step}) => {
                        return await step?.run("readFiles", async () => {
                            try {
                                const sandbox = await getSandbox(sandboxId);
                                const contents = [];
                                for (const file of files) {
                                    const content = await sandbox.files.read(file);
                                    contents.push({path: file, content});
                                }
                                return JSON.stringify(contents);
                            } catch (error) {
                                console.error(`Command failed Error ${error} \n`);
                                return `Command failed Error: ${error}`;
                            }
                        })
                    }
                })
            ],
            lifecycle: {
                onResponse: async ({result, network}) => {
                    const lastAssistantTextMessageText = lastAssistantTextMessageContent(result);

                    if (lastAssistantTextMessageText && network) {
                        if (lastAssistantTextMessageText.includes("<task_summary>")) {
                            network.state.data.summary = lastAssistantTextMessageText;
                        }
                    }

                    return result;
                },
            },
        });

        const network = createNetwork({
            name: "coding-agent-network",
            agents: [codeAgent],
            maxIter: 15,
            router: async ({network}) => {
                const summary = network.state.data.summary;

                if (summary) {
                    return;
                }

                return codeAgent;
            }
        })

        const result = await network.run(event.data.value);

        const sandboxUrl = await step.run("get-sandbox-url", async () => {
            const sandbox = await getSandbox(sandboxId);
            const host = sandbox.getHost(3000);

            return `https://${host}`
        })

        return {url: sandboxUrl, title: "Fragment", files: result.state.data.files, summary: result.state.data.summary};
    },
);