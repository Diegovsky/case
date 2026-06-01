import type { Route } from "./+types/quiz-card";
import {
	Box,
	Typography,
	RadioGroup,
	FormControlLabel,
	Radio,
	Button,
	Card,
	CardContent,
} from "@mui/material";

export interface QuizCardProps {
	question: string;
	options: string[];
	selectedOption: number | null;
	onOptionSelect: (index: number) => void;
	onSubmit?: () => void;
}

export default function QuizCard({
	question,
	options,
	selectedOption,
	onOptionSelect,
	onSubmit,
}: QuizCardProps) {
	return (
		<Card variant="outlined" sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
			<CardContent sx={{ p: 4 }}>
				<Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
					{question}
				</Typography>
				<Box sx={{ mb: 4 }}>
					<RadioGroup
						value={selectedOption}
						onChange={(e) => onOptionSelect(parseInt(e.target.value))}
					>
						{options.map((option, index) => (
							<FormControlLabel
								key={index}
								value={index}
								control={<Radio />}
								label={option}
								sx={{ display: "block", mb: 1 }}
							/>
						))}
					</RadioGroup>
				</Box>
				<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
					<Button
						variant="contained"
						disabled={selectedOption === null}
						onClick={onSubmit}
						size="large"
					>
						Submit Answer
					</Button>
				</Box>
			</CardContent>
		</Card>
	);
}
