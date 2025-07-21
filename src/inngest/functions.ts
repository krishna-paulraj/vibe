import {inngest} from "./client";
import {createAgent, openai} from "@inngest/agent-kit";

export const helloWorld = inngest.createFunction(
    {id: "hello-world"},
    {event: "test/hello.world"},
    async ({event}) => {
        const summarizer = createAgent({
            name: "summarizer",
            system: "You are a expert summarizer, You summarize in 2 words",
            model: openai({
                model: "gpt-4.1",
                baseUrl: "https://models.github.ai/inference",
                apiKey: process.env.AI_API_KEY
            }),
        });

        const {output} = await summarizer.run(
            `Summarize the following text: ${event.data.value}`
        )

        return {output};
    },
);