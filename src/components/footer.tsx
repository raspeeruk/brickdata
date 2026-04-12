import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-2 border-bd-rule mt-auto">
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-bd-orange flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-white leading-none">
                  BD
                </span>
              </div>
              <span className="font-heading text-base font-bold">
                BrickData
              </span>
            </div>
            <p className="text-sm text-bd-text-secondary leading-relaxed">
              UK property data for every address. Price history, EPC ratings,
              crime stats, and more.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-3 text-bd-text">
              Data Sources
            </h4>
            <ul className="space-y-1.5 text-sm text-bd-text-secondary">
              <li>HM Land Registry (OGL v3.0)</li>
              <li>EPC Open Data</li>
              <li>Police.uk (OGL v3.0)</li>
              <li>Postcodes.io</li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-3 text-bd-text">
              Links
            </h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-bd-blue hover:text-bd-text transition-colors"
                >
                  About BrickData
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-bd-blue hover:text-bd-text transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <hr className="rule-double my-6" />
        <p className="text-xs text-bd-text-secondary font-mono">
          Contains HM Land Registry data &copy; Crown copyright and database
          right {new Date().getFullYear()}. Licensed under the Open Government
          Licence v3.0.
        </p>
      </div>
    </footer>
  );
}
