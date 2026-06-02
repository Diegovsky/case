import { Box, LinearProgress, Typography } from "@mui/material";

interface ProgressBarProps {
	value: number;
	label?: string;
}

export default function ProgressBar({ value, label }: ProgressBarProps) {
	return (
		<Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
			{label && (
				<Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
					{label}
				</Typography>
			)}
			<LinearProgress 
				variant="determinate" 
				value={value} 
				sx={{ 
					height: 8, 
					borderRadius: 4,
					bgcolor: 'action.hover',
					'& .MuiLinearProgress-bar': {
						borderRadius: 4,
					}
				}} 
			/>
		</Box>
	);
}
