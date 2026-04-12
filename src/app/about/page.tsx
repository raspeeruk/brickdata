import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "BrickData provides free UK property data from official government sources: Land Registry, EPC certificates, and police crime data.",
};

export default function AboutPage() {
  return (
    <div className="grid-pattern min-h-screen">
      <div className="mx-auto max-w-[800px] px-4 py-12">
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-bd-text tracking-tight mb-6">
          About BrickData
        </h1>

        <div className="space-y-6 text-bd-text font-body leading-relaxed">
          <p>
            BrickData is a free property data tool covering every residential
            address in England and Wales. We aggregate data from official
            government sources — no estimates, no guesswork, no paywalls.
          </p>

          <hr className="rule-double" />

          <h2 className="font-heading text-xl font-bold">Our Data Sources</h2>

          <div className="space-y-4">
            <div className="border border-bd-grid bg-bd-surface p-4">
              <h3 className="font-heading font-bold text-bd-text">
                HM Land Registry
              </h3>
              <p className="text-sm text-bd-text-secondary mt-1">
                Every recorded property sale in England and Wales since January
                1995. Price paid, date, property type, and tenure. Updated
                monthly. Open Government Licence v3.0.
              </p>
            </div>
            <div className="border border-bd-grid bg-bd-surface p-4">
              <h3 className="font-heading font-bold text-bd-text">
                EPC Open Data
              </h3>
              <p className="text-sm text-bd-text-secondary mt-1">
                Energy Performance Certificates for over 22 million properties.
                Energy rating (A–G), floor area, heating type, insulation,
                annual energy costs, CO₂ emissions, and 100+ more fields.
              </p>
            </div>
            <div className="border border-bd-grid bg-bd-surface p-4">
              <h3 className="font-heading font-bold text-bd-text">
                Police.uk
              </h3>
              <p className="text-sm text-bd-text-secondary mt-1">
                Street-level crime data by category for every neighbourhood in
                England and Wales. Open Government Licence v3.0.
              </p>
            </div>
          </div>

          <hr className="rule-double" />

          <h2 className="font-heading text-xl font-bold">
            No Estimates. Only Data.
          </h2>
          <p>
            Unlike other property sites, BrickData never displays
            &ldquo;estimated values&rdquo; or algorithmic guesses. Every figure
            you see comes directly from an official government source and
            includes a reference to its origin. If a property has no recorded
            sale, we say so — we don&apos;t fabricate a number.
          </p>

          <hr className="rule-double" />

          <p className="text-xs text-bd-text-secondary font-mono">
            Contains HM Land Registry data &copy; Crown copyright and database
            right {new Date().getFullYear()}. Licensed under the Open Government
            Licence v3.0. EPC data from the Ministry of Housing, Communities &
            Local Government. Crime data from data.police.uk.
          </p>
        </div>
      </div>
    </div>
  );
}
