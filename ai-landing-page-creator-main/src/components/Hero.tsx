import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-mountains.jpeg";

const Hero = () => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Mountain landscape"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Gradient Overlay - Creates the fade effect from top */}
      <div className="absolute inset-0 hero-gradient-overlay" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 -mt-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-foreground animate-fade-in-up leading-tight">
            Give Your AI Agents
            <br />
            <span className="text-gradient">Context + Memory</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-lg md:text-xl text-muted-foreground font-medium animate-fade-in-up-delay">
            Not just storage, but understanding.
          </p>

          {/* CTA Button */}
          <div className="mt-10 animate-fade-in-up-delay-2">
            <button className="glass-button group inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-medium text-foreground">
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
