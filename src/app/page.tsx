"use client";

import {Button} from "@/components/ui/button";
import {useTRPC} from "@/trpc/client";
import {useMutation} from "@tanstack/react-query";

const Page = () => {
    const trpc = useTRPC();
    const invoke = useMutation(trpc.invoke.mutationOptions({}))

    return (
        <div
            className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
            Hello
            <Button onClick={() => invoke.mutate({text: "Krish"})}>Invoke</Button>
        </div>
    );
};

export default Page;
