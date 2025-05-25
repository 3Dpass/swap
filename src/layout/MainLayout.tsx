import { Outlet, useSearchParams } from "react-router-dom";
import SeoHelmet from "../components/atom/SeoHelmet";
import Footer from "../components/organism/Footer";
import HeaderTopNav from "../components/organism/HeaderTopNav";
import { useEffect } from "react";

const MainLayout = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const networkSession = window.localStorage.getItem("network");
    const networkParam = searchParams.get("network");

    if (networkSession && networkParam) {
      window.localStorage.setItem("network", networkParam);
      setSearchParams({ network: networkParam });
    } else if (networkSession) {
      setSearchParams({ network: networkSession });
    }
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <SeoHelmet />
      <HeaderTopNav />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
