import { AppBar, Avatar, Box, Toolbar, Typography } from "@mui/material";
import { PROJECT_TITLE } from "~/consts";
import { useApp } from "~/context";
import { fadeVisibility, type Hook } from "~/utils";

export default function AppHeader({ open }: { open: Hook<boolean> }) {
	const { user } = useApp();
	const fadeOnClose = {
		opacity: !open.value ? 1 : 0,
		...fadeVisibility,
	};
	return (
		<AppBar position="sticky">
			<Toolbar
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Typography variant="h6" sx={{ ...fadeOnClose }}>
					{PROJECT_TITLE}
				</Typography>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<Typography variant="body1">{user.first_name}</Typography>
					<Avatar alt="John Doe" />
				</Box>
			</Toolbar>
		</AppBar>
	);
}
