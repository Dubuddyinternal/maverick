import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import StepsTimeline from '@/components/StepsTimeline';
import DemoDoodle from '@/components/DemoDoodle';
import StoryRoad from '@/components/StoryRoad';
import { T } from '@/lib/config';

export const metadata = { title: 'How it works · Maverick by Dubuddy' };

export default function HowItWorksPage() {
  return (
    <div className="page">
      <SiteNav />
      <div className="sec center" style={{ paddingBottom: "24px" }}>
        <h2 style={{ fontSize: "56px" }}>
          Six steps. That's it.
        </h2>
        <p className="lead" style={{ fontSize: "22px" }}>
          From your phone to your UPI. Tap the{" "}
          <b>
            i
          </b>
          {" "}on any step for the detail.
        </p>
      </div>
      <div className="sec" style={{ paddingTop: "10px", paddingBottom: "18px" }}>
        <StepsTimeline />
      </div>
      <div id="rulebook" className="sec center" style={{ paddingTop: "28px", paddingBottom: "0" }}>
        <span className="flowstep" style={{ justifyContent: "center" }}>
          <i>
            ✎
          </i>
          the rulebook
        </span>
        <h2 style={{ fontSize: "52px" }}>
          The Maverick Rulebook
        </h2>
        <p className="lead" style={{ margin: "10px auto 0", maxWidth: "660px", fontSize: "22px" }}>
          Everything you need to make a video we can approve.
        </p>
      </div>
      <div className="flow left wide" style={{ paddingTop: "48px" }}>
        <div className="flowart" aria-hidden="true">
          <svg viewBox="0 0 400 400">
            <g className="ico" style={{ stroke: "#E6DED6" }} stroke="#E6DED6" strokeWidth="7" fill="none">
              <g transform="translate(70,70) scale(2.2)">
                <use href="#g-bubble" />
              </g>
            </g>
            <g className="ico" style={{ stroke: "#F1684C" }} stroke="#F1684C" strokeWidth="7" fill="none" opacity=".4">
              <g transform="translate(250,250) scale(1.3)">
                <use href="#g-check" />
              </g>
            </g>
          </svg>
        </div>
        <div className="wrap">
          <div className="pbnote">
            <svg className="ico" viewBox="0 0 100 100">
              <use href="#d-bubble" />
            </svg>
            <div>
              <h3>
                Keep it natural.
              </h3>
              <ul>
                <li>
                  <svg className="ico" viewBox="0 0 100 100">
                    <use href="#d-check" />
                  </svg>
                  <span>
                    Be yourself and create the video naturally.
                  </span>
                </li>
                <li>
                  <svg className="ico" viewBox="0 0 100 100">
                    <use href="#d-check" />
                  </svg>
                  <span>
                    Just include the required mentions below.
                  </span>
                </li>
                <li>
                  <svg className="ico" viewBox="0 0 100 100">
                    <use href="#d-check" />
                  </svg>
                  <span>
                    You can pick from our video ideas.
                  </span>
                </li>
                <li>
                  <svg className="ico" viewBox="0 0 100 100">
                    <use href="#d-check" />
                  </svg>
                  <span>
                    This is simply awareness about our product. Keep it natural.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="flow right wide">
        <div className="flowart" aria-hidden="true">
          <svg viewBox="0 0 400 400">
            <g className="ico" style={{ stroke: "#E6DED6" }} stroke="#E6DED6" strokeWidth="7" fill="none">
              <g transform="translate(60,100) scale(2.3)">
                <use href="#g-film" />
              </g>
            </g>
            <g className="ico" style={{ stroke: "#3599FF" }} stroke="#3599FF" strokeWidth="7" fill="none" opacity=".35">
              <g transform="translate(250,40) scale(1.2)">
                <use href="#g-play" />
              </g>
            </g>
          </svg>
        </div>
        <div className="wrap">
          <div className="flowhead">
            <span className="flowstep">
              <i>
                A
              </i>
              part one
            </span>
            <h2>
              What type of video can you make?
            </h2>
            <p className="lead">
              These are just ideas, not rules. Anything that sounds like you is fine.
            </p>
          </div>
          <div className="pbgrid">
            <div className="pbcard">
              <span className="eyebrow">
                With your face, examples
              </span>
              <h4>
                You on camera
              </h4>
              <ul className="pblist">
                <li>
                  <i />
                  <span>
                    Strategy videos
                  </span>
                </li>
                <li>
                  <i />
                  <span>
                    Study vlogs
                  </span>
                </li>
                <li>
                  <i />
                  <span>
                    College videos
                  </span>
                </li>
                <li>
                  <i />
                  <span>
                    Asking or sharing CUET score videos
                  </span>
                </li>
                <li>
                  <i />
                  <span>
                    College tour vlogs
                  </span>
                </li>
                <li>
                  <i />
                  <span>
                    Simply coming on screen and saying "I am practicing from this platform"
                  </span>
                </li>
              </ul>
            </div>
            <div className="pbcard">
              <span className="eyebrow">
                Without your face, examples
              </span>
              <h4>
                Hands, screen or voice
              </h4>
              <ul className="pblist">
                <li>
                  <i />
                  <span>
                    Start a faceless channel where you solve one PYQ daily
                  </span>
                </li>
                <li>
                  <i />
                  <span>
                    Every video keeps earning, so every reel you post earns you money
                  </span>
                </li>
                <li>
                  <i />
                  <span>
                    Solve PYQs on screen
                  </span>
                </li>
                <li>
                  <i />
                  <span>
                    Chapter-wise question solving
                  </span>
                </li>
                <li>
                  <i />
                  <span>
                    A "question of the day" series your followers come back for
                  </span>
                </li>
                <li>
                  <i />
                  <span>
                    Topic-wise quick revision reels, one topic per reel
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="flow left wide">
        <div className="wrap">
          <div className="flowhead">
            <span className="flowstep">
              <i>
                B
              </i>
              part two
            </span>
            <h2>
              What every video needs
            </h2>
            <p className="lead">
              Two compulsory things, and a few you can cover if they fit.
            </p>
          </div>
          <div>
            <div className="card" style={{ padding: "38px 42px" }}>
              <div className="needrow">
                <span className="num">
                  1
                </span>
                <div>
                  <span className="tagc">
                    Compulsory
                  </span>
                  <b>
                    Mention Dubuddy in your video, and use the keyword "CUET 2027"
                  </b>
                  <p>
                    Say Dubuddy out loud, and put CUET 2027 in the title or the description.
                  </p>
                </div>
              </div>
              <div className="needrow">
                <span className="num">
                  2
                </span>
                <div>
                  <span className="tagc">
                    Compulsory
                  </span>
                  <b>
                    Put our trackable website link in the video description
                  </b>
                  <p>
                    We create the link for you and send it across. Just paste it in exactly as given.
                  </p>
                </div>
              </div>
              <div className="needrow">
                <span className="num">
                  3
                </span>
                <div>
                  <span className="tagc tago">
                    Optional
                  </span>
                  <b>
                    You can cover these in your videos
                  </b>
                  <ul className="pblist" style={{ marginTop: "10px" }}>
                    <li>
                      <i />
                      <span>
                        Questions repeating from Dubuddy
                      </span>
                    </li>
                    <li>
                      <i />
                      <span>
                        If you are practicing before January 2027, focus on chapter-wise PYQs. After January, focus on full-length PYQs.
                      </span>
                    </li>
                    <li>
                      <i />
                      <span>
                        Product facts you can mention: all PYQs for every shift, every year and every subject, mock tests, chapter-wise PYQs, PDFs of repeated questions, and full-length repeated-question sets.
                      </span>
                    </li>
                    <li>
                      <i />
                      <span>
                        Dubuddy&apos;s CUET mock tests: practise full mocks along with PYQs, starting at just ₹1.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="demo-videos" className="flow right wide" style={{ scrollMarginTop: "24px" }}>
        <div className="wrap">
          <div className="flowhead">
            <h2>
              Demo videos, how to film it
            </h2>
            <p className="lead">
              Made by us. Watch one, copy the shape.
            </p>
          </div>
          <div className="demorow">
            <DemoDoodle />
          <div className="vids three">
            <div className="vtile">
              <div className="th">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/5bIe18qZ9Ug?rel=0&playsinline=1"
                  title="Score Reveal, Comment Your Scores"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                />
              </div>
              <div className="cap2">
                <h4>
                  Score Reveal, Comment Your Scores
                </h4>
                <p>
                  Result screenshot, hands, voiceover
                </p>
              </div>
            </div>
            <div className="vtile">
              <div className="th">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/R8dZRC2E6dw?rel=0&playsinline=1"
                  title="Get CUET Mocks + PYQs at ONLY ₹1"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                />
              </div>
              <div className="cap2">
                <h4>
                  Get CUET Mocks + PYQs at ONLY ₹1
                </h4>
              </div>
            </div>
            <div className="vtile soon">
              <div className="th">
                <div>
                  <svg viewBox="0 0 64 64" aria-hidden="true">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="var(--ink)" strokeWidth="4" />
                    <path d="M32 18v15l10 6" fill="none" stroke="var(--coral)" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <span className="hand">coming soon</span>
                </div>
              </div>
              <div className="cap2">
                <h4>
                  More demo videos coming soon
                </h4>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
      <div className="endcta">
        <StoryRoad />
        <div className="wrap">
          <svg className="dblogo lg2" viewBox="0 0 164 40">
            <use href="#dblogo" />
          </svg>
          <h2>
            Start earning.
          </h2>
          <p className="lead">
            You've read it. Your first{" "}
            <span>{T.base}</span>
            {" "}is one video away.
          </p>
          <Link href="/login" className="btn lg">
            Start earning
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
