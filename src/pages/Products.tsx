import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import vegetablesImg from "@/assets/vegetables.jpg";
import fruitsImg from "@/assets/fruits.jpg";
import grainsImg from "@/assets/grains.jpg";
import { Link } from "react-router-dom";

const products = [
  {
    id: 1,
    name: "Organic Tomatoes",
    category: "vegetables",
    price: 4.99,
    image: vegetablesImg,
  },
  {
    id: 2,
    name: "Fresh Carrots",
    category: "vegetables",
    price: 3.49,
    image: vegetablesImg,
  },
  {
    id: 3,
    name: "Leafy Greens Mix",
    category: "vegetables",
    price: 5.99,
    image: vegetablesImg,
  },
  {
    id: 4,
    name: "Sweet Peppers",
    category: "vegetables",
    price: 6.49,
    image: vegetablesImg,
  },
  {
    id: 5,
    name: "Organic Apples",
    category: "fruits",
    price: 7.99,
    image: fruitsImg,
  },
  {
    id: 6,
    name: "Fresh Strawberries",
    category: "fruits",
    price: 8.99,
    image: fruitsImg,
  },
  {
    id: 7,
    name: "Citrus Mix",
    category: "fruits",
    price: 9.49,
    image: fruitsImg,
  },
  {
    id: 8,
    name: "Organic Berries",
    category: "fruits",
    price: 10.99,
    image: fruitsImg,
  },
  {
    id: 9,
    name: "Whole Wheat",
    category: "grains",
    price: 12.99,
    image: grainsImg,
  },
  {
    id: 10,
    name: "Organic Oats",
    category: "grains",
    price: 8.49,
    image: grainsImg,
  },
  {
    id: 11,
    name: "Brown Rice",
    category: "grains",
    price: 11.99,
    image: grainsImg,
  },
  {
    id: 12,
    name: "Quinoa",
    category: "grains",
    price: 14.99,
    image: grainsImg,
  },
];

const Products = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 20]);
  const { addToCart } = useCart();

  const filteredProducts = products.filter((product) => {
    const categoryMatch =
      selectedCategories.length === 0 ||
      selectedCategories.includes(product.category);
    const priceMatch =
      product.price >= priceRange[0] && product.price <= priceRange[1];
    return categoryMatch && priceMatch;
  });

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-background">
        {/* Page Header */}
        <div className="bg-muted/30 py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-['Playfair_Display']">
              Our Products
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Browse our complete collection of fresh, organic agricultural
              products
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <Card className="sticky top-20 border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Filters</h3>

                  {/* Categories */}
                  <div className="mb-6">
                    <h4 className="font-medium text-sm mb-3 text-foreground">
                      Categories
                    </h4>
                    <div className="space-y-3">
                      {["vegetables", "fruits", "grains"].map((category) => (
                        <div key={category} className="flex items-center gap-2">
                          <Checkbox
                            id={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => toggleCategory(category)}
                          />
                          <label
                            htmlFor={category}
                            className="text-sm capitalize cursor-pointer text-muted-foreground hover:text-foreground transition-smooth"
                          >
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h4 className="font-medium text-sm mb-3 text-foreground">
                      Price Range
                    </h4>
                    <Slider
                      min={0}
                      max={20}
                      step={1}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <p className="italic text-xs">
                        {priceRange[0]} <sub>HBAR</sub>
                      </p>
                      <p className="italic text-xs">
                        {priceRange[1]} <sub>HBAR</sub>
                      </p>
                      {/* <p>${priceRange[1]}</p> */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="mb-6">
                <p className="text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length}
                  products
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="group overflow-hidden border-border hover:shadow-medium transition-smooth"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-smooth group-hover:scale-110"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary flex flex-row">
                          {product.price}
                          <p>
                            <sub className="text-xs italic">HBAR</sub>
                          </p>
                        </span>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary-light text-primary-foreground"
                          onClick={() => addToCart(product)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
