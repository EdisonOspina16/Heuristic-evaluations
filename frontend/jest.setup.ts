import "@testing-library/jest-dom";

import React, { JSX } from "react";

jest.mock("axios");

const pushMock = jest.fn();
(globalThis as typeof globalThis & { __NEXT_PUSH_MOCK__?: jest.Mock }).__NEXT_PUSH_MOCK__ = pushMock;

jest.mock("next/navigation", () => ({
    usePathname: () => "/account/users",
    useRouter: () => ({
        push: pushMock,
        replace: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        prefetch: jest.fn(),
    }),
}));

jest.mock("next/link", () => {
    return function LinkMock({
        href,
        children,
        ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
        return React.createElement("a", { href, ...props }, children);
    };
});

jest.mock("next/image", () => {
    return function ImageMock({
        src,
        alt,
        ...props
    }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string | { src: string } }) {
        const resolvedSrc = typeof src === "string" ? src : src.src;
        return React.createElement("img", { src: resolvedSrc, alt, ...props });
    };
});

jest.mock("framer-motion", () => {
  const createMotionComponent = (tag: keyof JSX.IntrinsicElements) =>
    React.forwardRef<
      HTMLElement,
      React.HTMLAttributes<HTMLElement> & { animate?: Record<string, unknown>; initial?: unknown; transition?: unknown; exit?: unknown }
    >(({ animate, style, children, initial, transition, exit, ...props }, ref) => {
      const animatedStyle =
        animate && typeof animate === "object"
          ? { ...(style || {}), ...animate }
          : style;

            return React.createElement(tag, { ref, style: animatedStyle, ...props }, children);
        });

    return {
        AnimatePresence: ({ children }: { children: React.ReactNode }) =>
            React.createElement(React.Fragment, null, children),
        motion: new Proxy(
            {},
            {
                get: (_target, tag) => createMotionComponent(tag as keyof JSX.IntrinsicElements),
            }
        ),
    };
});

beforeEach(() => {
    localStorage.clear();
    pushMock.mockClear();
});

afterEach(() => {
    jest.clearAllMocks();
});
