import {
	Button,
	Divider,
	Drawer,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Toolbar,
	Typography,
} from "@mui/material";
import { GraduationCap, Menu, MessageSquare } from "lucide-react";
import { NavLink } from "react-router";
import { PROJECT_TITLE } from "~/consts";
import { fadeVisibility, type Hook } from "~/utils";

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 60;

const sections = [
	{ label: "Chat", icon: <MessageSquare />, link: "/" },
	{ label: "Learn", icon: <GraduationCap />, link: "/topics" },
];

export default function AppDrawer({ open }: { open: Hook<boolean> }) {
	const fadeOnClose = {
		opacity: open.value ? 1 : 0,
		...fadeVisibility,
	};
	return (
		<Drawer
			variant="permanent"
			sx={{
				width: open.value ? DRAWER_WIDTH : COLLAPSED_WIDTH,
				flexShrink: 0,
				transition: (theme) =>
					theme.transitions.create("width", {
						easing: theme.transitions.easing.sharp,
						duration: theme.transitions.duration.enteringScreen,
					}),
				"& .MuiDrawer-paper": {
					width: open.value ? DRAWER_WIDTH : COLLAPSED_WIDTH,
					transition: (theme) =>
						theme.transitions.create("width", {
							easing: theme.transitions.easing.sharp,
							duration: theme.transitions.duration.enteringScreen,
						}),
					overflowX: "hidden",
					borderRight: "1px solid rgba(0, 0, 0, 0.12)",
				},
			}}
		>
			<Toolbar>
				<IconButton
					color="inherit"
					aria-label="open drawer"
					onClick={open.partial(!open.value)}
					edge="start"
					sx={{ p: 0.5, mr: 1 }}
				>
					<Menu />
				</IconButton>
				<Typography sx={{ ...fadeOnClose }}>{PROJECT_TITLE}</Typography>
			</Toolbar>
			<Divider />
			<List sx={{ py: 0 }}>
				{sections.map(({ label, icon, link }) => (
					<ListItem key={label} disablePadding>
						<ListItemButton
							component={NavLink}
							to={link}
							sx={{
								display: "flex",
								alignItems: "center",
								px: 2,
								"&.active": {
									backgroundColor: "rgba(0, 0, 0, 0.08)",
									fontWeight: "bold",
								},
							}}
						>
							<ListItemIcon>{icon}</ListItemIcon>
							<ListItemText
								primary={label}
								sx={{
									...fadeOnClose,
								}}
							/>
						</ListItemButton>
					</ListItem>
				))}
			</List>
		</Drawer>
	);
}
