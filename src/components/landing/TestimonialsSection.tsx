const items = [
  { quote: "Cut my CFD debugging time in half. It explains residual plots better than my advisor.", who: "Aarav S.", role: "PhD, Aerospace Engineering" },
  { quote: "I drop in a stress contour and it points out exactly where my mesh is rubbish.", who: "Maya L.", role: "FEA Engineer, Robotics Startup" },
  { quote: "Honestly feels like having a 24/7 study group for thermo and fluids.", who: "Tomás P.", role: "Mechanical Engineering Student" },
  { quote: "The research copilot wrote a better methodology section than my last paper.", who: "Dr. Lin H.", role: "Associate Professor, MAE" },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="container mx-auto max-w-7xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">// Loved by engineers</p>
        <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">From the lab to the runway</h2>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map((t) => (
          <figure key={t.who} className="glass rounded-2xl p-6">
            <blockquote className="text-sm leading-relaxed">"{t.quote}"</blockquote>
            <figcaption className="mt-4 text-xs">
              <div className="font-semibold">{t.who}</div>
              <div className="text-muted-foreground">{t.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
