export type AnalysisTab = "fibonacci" | "color";

export interface ColorResult {
  color_distribution: string;
  hue_distribution: string;
  brightness_distribution: string;
  saturation_distribution: string;
  histogram_3d: string;
}

export interface AnalysisState {
  activeTab: AnalysisTab;
  selectedFile: File | null;
  previewUrl: string | null;
  kValue: string;
  bWeight: string;
  fibResult: string | null;
  colorResults: ColorResult | null;
  loading: boolean;
  error: string | null;
}
