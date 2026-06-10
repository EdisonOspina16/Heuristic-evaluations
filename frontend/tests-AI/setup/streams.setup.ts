import { TransformStream, ReadableStream, WritableStream } from "web-streams-polyfill";

if (typeof globalThis.TransformStream === "undefined") {
    globalThis.TransformStream = TransformStream as any;
}
if (typeof globalThis.ReadableStream === "undefined") {
    globalThis.ReadableStream = ReadableStream as any;
}
if (typeof globalThis.WritableStream === "undefined") {
    globalThis.WritableStream = WritableStream as any;
}