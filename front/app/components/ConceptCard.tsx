import { Box, Typography, Card, CardContent, Divider } from "@mui/material";

interface ConceptCardProps {
	title: string;
	content: string;
	type?: "theory" | "example" | "warning";
}

export default function ConceptCard({ title, content, type = "theory" }: ConceptCardProps) {
	const typeColors = {
		theory: { border: "primary.main", bg: "primary.lightest" }, // Assuming theme has lightest, otherwise fallback
		example: "secondary.main",
		warning: "error.main",
	};

	return (
		<Card variant="outlined" sx={{ 
			mb: 3, 
			borderLeft: `6px solid ${type === "theory" ? "primary.main" : type === "example" ? "secondary.main" : "error.main"}`,
			boxShadow: 1
		}}>
			<CardContent sx={{ p: 3 }}>
				<Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: "bold" }}>
					{title}
				</Typography>
				<Divider sx={{ mb: 2 }} />
				<Typography variant="body1" sx={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
					{content}
				</Typography>
			</CardContent>
		</Card>
	);
}
