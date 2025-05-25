import { Outlet } from "react-router-dom";
import SeoHelmet from "../components/atom/SeoHelmet";
import Footer from "../components/organism/Footer";
import HeaderTopNav from "../components/organism/HeaderTopNav";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SeoHelmet />
      <HeaderTopNav />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
