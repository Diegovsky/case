import { AppBar, Avatar, Box, Toolbar, Typography } from "@mui/material";
import { PROJECT_TITLE } from "~/consts";
import { fadeVisibility, type Hook } from "~/utils";

export default function AppHeader({ open }: { open: Hook<boolean> }) {
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
					<Typography variant="body1">John Doe</Typography>
					<Avatar alt="John Doe" src="/static/images/avatar/1.jpg" />
				</Box>
			</Toolbar>
		</AppBar>
	);
}
