import { Card } from "./ui/card";
import { motion } from "framer-motion";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Card className="p-6 h-full hover:shadow-lg transition-shadow">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
