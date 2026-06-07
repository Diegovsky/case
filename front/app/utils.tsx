import type { ChangeEventHandler, SetStateAction } from "react";

export type SetState<T> = React.Dispatch<SetStateAction<T>>;

export class Hook<T> {
	value: T;
	set: SetState<T>;
	constructor([value, setValue]: [T, SetState<T>]) {
		this.value = value;
		this.set = setValue;
	}

	partial(value: T): () => void {
		const set = this.set;
		return () => set(value);
	}

	onChange(): (e: { target: { value: T } }) => void {
		const set = this.set;
		return (e) => set(e.target.value);
	}
}

export class HookedArray<T> extends Hook<Array<T>> {
	append(val: T) {
		this.set((current) => [...current, val]);
	}
	extend(val: Array<T>) {
		this.set((current) => [...current, ...val]);
	}
	removeFilter(filter: (val: T, i?: number) => boolean) {
		this.set((current) => current.filter(filter));
	}
}

export const fadeVisibility = {
	transition: "opacity 0.2s",
};

export function tryCatch<T>(cb: () => T, fallback: T): T {
	try {
		return cb();
	} catch {
		return fallback;
	}
}

export function handleResponse<T extends {} | unknown>(
	val:
		| { data: T | undefined; error: undefined }
		| { data: undefined; error: unknown },
): T {
	if (val.data !== undefined) return val.data;
	throw new Error(JSON.stringify(val.error));
}
