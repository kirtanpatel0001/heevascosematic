import Image from 'next/image';

export default function OfferBanner() {
  return (
    <section className="w-full flex justify-center items-center">
      <div className="w-full max-w-screen-2xl">
        <Image
          src="/imges/banner3.png"
          alt="Offer Banner"
          width={1920}
          height={600}
          className="w-full h-auto object-contain"
          priority
        />
      </div>
    </section>
  );
}