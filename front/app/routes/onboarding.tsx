import type { Route } from "./+types/onboarding";
import { Box, Typography, Container, Button, Grid, Card, CardActionArea, CardContent } from "@mui/material";
import { useNavigate } from "react-router";
import { useState } from "react";

const INTERESTS = [
	"Sports",
	"Music",
	"Gaming",
	"Technology",
	"Cooking",
	"Art",
	"Science",
	"History",
	"Literature",
	"Cinema",
];

export default function Onboarding() {
	const navigate = useNavigate();
	const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

	const toggleInterest = (interest: string) => {
		setSelectedInterests((prev) =>
			prev.includes(interest)
				? prev.filter((i) => i !== interest)
				: [...prev, interest]
		);
	};

	const handleContinue = () => {
		if (selectedInterests.length === 0) return;
		// Mock save to database
		console.log("Saving interests:", selectedInterests);
		navigate("/diagnostic");
	};

	return (
		<Container maxWidth="md">
			<Box
				sx={{
					marginTop: 8,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 4,
					textAlign: "center",
				}}
			>
				<Box>
					<Typography variant="h4" component="h1" gutterBottom>
						Let's get to know you
					</Typography>
					<Typography variant="body1" color="text.secondary">
						Select the topics that interest you most. We'll use these to personalize your math examples!
					</Typography>
				</Box>

				<Grid container spacing={2} sx={{ width: "100%" }}>
					{INTERESTS.map((interest) => (
						<Grid item xs={6} sm={4} md={3} key={interest}>
							<Card
								variant="outlined"
								sx={{
									borderColor: selectedInterests.includes(interest) ? "primary.main" : "divider",
									borderWidth: selectedInterests.includes(interest) ? 2 : 1,
									transition: "all 0.2s",
								}}
							>
								<CardActionArea onClick={() => toggleInterest(interest)}>
									<CardContent>
										<Typography
											variant="body1"
											fontWeight={selectedInterests.includes(interest) ? "bold" : "normal"}
											color={selectedInterests.includes(interest) ? "primary.main" : "text.primary"}
										>
											{interest}
										</Typography>
									</CardContent>
								</CardActionArea>
							</Card>
						</Grid>
					))}
				</Grid>

				<Button
					variant="contained"
					size="large"
					disabled={selectedInterests.length === 0}
					onClick={handleContinue}
					sx={{ px: 4, py: 1.5, fontSize: "1.1rem" }}
				>
					Continue
				</Button>
			</Box>
		</Container>
	);
}
