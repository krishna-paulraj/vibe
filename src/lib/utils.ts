import {clsx, type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";
import {Sandbox} from "@e2b/code-interpreter";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export async function getSandbox(sandboxId: string) {
    const sandbox = await Sandbox.connect(sandboxId);
    return sandbox;
}