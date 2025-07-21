"use client";

import {Button} from "@/components/ui/button";
import {useTRPC} from "@/trpc/client";
import {useMutation} from "@tanstack/react-query";
import {Input} from "@/components/ui/input";
import {useState} from "react";

const Page = () => {
    const trpc = useTRPC();
    const invoke = useMutation(trpc.invoke.mutationOptions({}))

    const [value, setValue] = useState("");

    return (
        <div
            className="p-4 max-w-7xl mx-auto">
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={"Input"}/>
            <Button disabled={invoke.isPending} onClick={() => invoke.mutate({value: value})}>Invoke</Button>
        </div>
    );
};

export default Page;
