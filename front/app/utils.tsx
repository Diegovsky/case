import type { SetStateAction } from "react";

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
}

export const fadeVisibility = {
	transition: "opacity 0.2s",
};
