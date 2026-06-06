import { createContext, type ReactNode, useContext, type Ref } from "react";
import type { User } from "~/client/types.gen";
import type { Hook } from "./utils";

export interface App {
	user: User;
	aiContext: string | object;
}

const AppContext = createContext<App | null>(null);

export function AppProvider({
	children,
	app,
}: {
	children: ReactNode;
	app: App;
}) {
	return <AppContext.Provider value={app}>{children}</AppContext.Provider>;
}

export function useApp(): App {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error(
			"useApp must be used within an AppProvider and a user must be authenticated",
		);
	}
	return context;
}
