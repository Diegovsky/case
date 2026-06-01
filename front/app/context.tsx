import { createContext, type ReactNode, useContext } from "react";
import type { User } from "~/client/types.gen";

export interface App {
	user: User;
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
