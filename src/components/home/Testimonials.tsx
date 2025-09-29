import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Crop rotation is key to maintaining soil health. We rotate legumes with grains to naturally replenish nitrogen.",
    author: "John Anderson",
    role: "Senior Agricultural Specialist",
  },
  {
    quote: "Investing in organic certification has increased our market value by 40%. Consumers trust quality.",
    author: "Maria Santos",
    role: "Organic Farm Owner",
  },
  {
    quote: "Drip irrigation reduced our water usage by 60% while improving crop yields. Smart farming is the future.",
    author: "David Chen",
    role: "Sustainable Agriculture Expert",
  },
];

const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-['Playfair_Display']">
            Expert Insights
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Learn from industry leaders and experienced farmers sharing their knowledge
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="border-border hover:shadow-medium transition-smooth animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <Quote className="w-10 h-10 text-primary/20 mb-4" />
                <p className="text-foreground/90 mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
