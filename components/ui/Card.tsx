import { View, type ViewProps } from "react-native";

interface Props extends ViewProps {
  children: React.ReactNode;
  elevated?: boolean;
}

export function Card({ children, elevated = false, style, ...props }: Props) {
  return (
    <View
      className={`rounded-2xl p-4 border ${
        elevated
          ? "bg-[#162437] border-[#2d4a6a]"
          : "bg-[#111f2e] border-[#1e3a52]"
      }`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
