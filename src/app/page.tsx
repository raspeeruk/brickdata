import { SearchBar } from "@/components/search-bar";

export default function Home() {
  return (
    <div className="grid-pattern min-h-[80vh] flex flex-col items-center justify-center px-4">
      {/* Ghost postcode in background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="font-mono text-[12rem] sm:text-[20rem] font-bold text-bd-grid-strong/40 leading-none tracking-tighter">
          SW1A
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-bd-orange flex items-center justify-center mb-4 mx-auto">
            <span className="font-mono text-2xl font-bold text-white">BD</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-bd-text tracking-tight">
            BrickData
          </h1>
          <p className="mt-2 text-bd-text-secondary font-body text-lg">
            UK property data for every address
          </p>
        </div>

        <SearchBar size="large" />

        {/* Data source badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-bd-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-bd-positive inline-block" />
            Land Registry
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-bd-blue inline-block" />
            EPC Certificates
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-bd-orange inline-block" />
            Crime Data
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-bd-negative inline-block" />
            Flood Risk
          </span>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="data-value text-2xl sm:text-3xl text-bd-text">29M+</p>
            <p className="text-xs text-bd-text-secondary mt-1">Properties</p>
          </div>
          <div>
            <p className="data-value text-2xl sm:text-3xl text-bd-text">
              30yr
            </p>
            <p className="text-xs text-bd-text-secondary mt-1">Price History</p>
          </div>
          <div>
            <p className="data-value text-2xl sm:text-3xl text-bd-text">
              Free
            </p>
            <p className="text-xs text-bd-text-secondary mt-1">Open Data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
