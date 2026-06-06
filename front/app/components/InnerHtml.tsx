import { useMemo, type ComponentProps } from "react";

export default function InnerHtml({
	content,
	...props
}: ComponentProps<"span"> & { content: string }) {
	// biome-ignore lint/correctness/useExhaustiveDependencies: .
	const html = useMemo(
		() => (
			<span
				style={{ display: "contents" }}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized in the backend
				dangerouslySetInnerHTML={{
					__html: content,
				}}
				{...props}
			/>
		),
		[content],
	);
	return html;
}
