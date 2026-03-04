const Footer = () => {
  return (
    <footer className="py-6 border-t border-border/20">
      <div className="container mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Daniel Cabrera. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
