import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-background">
        {/* Page Header */}
        <div className="bg-muted/30 py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-['Playfair_Display']">
              About Us
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Connecting farmers directly with consumers
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg leading-relaxed text-foreground/90">
                An agro e-commerce platform revolutionizes agricultural trade by connecting farmers directly with consumers. This digital marketplace eliminates traditional middlemen, ensuring fairer prices for both producers and buyers. Farmers gain access to wider markets and better income opportunities while consumers receive fresher, quality produce. The platform offers diverse agricultural products including fruits, vegetables, grains, dairy, and organic items. It provides complete transparency about product origins and farming methods. With secure digital payments and reliable delivery systems, it brings farm-fresh goods directly to customers' doorsteps. This model creates an efficient, transparent ecosystem that benefits everyone in the agricultural value chain.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
