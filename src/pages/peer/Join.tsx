import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { PageHeading } from "../../components/PageHeading";
import { Panel } from "../../components/Panel";
import { Button } from "../../components/Button";
import { Spinner } from "../../components/Spinner";
import { TextField } from "../../components/form/TextField";
import { ShareCode, EnterCode } from "../../components/peer/CodeExchange";
import { usePeer } from "../../context/PeerContext";
import { useToast } from "../../context/ToastContext";
import { settingBounds } from "../../config/defaultSettings";

export default function Join() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { role, connection, lobby, startGuest, guestAcceptOffer, leave } = usePeer();

  const [name, setName] = useState("");
  const [answerCode, setAnswerCode] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const stage = role === "guest" ? "connect" : "name";

  // Once the host completes the handshake and sends the lobby, move on.
  useEffect(() => {
    if (role === "guest" && connection === "connected" && lobby) {
      navigate(ROUTES.peerLobby);
    }
  }, [role, connection, lobby, navigate]);

  const beginConnect = () => {
    startGuest(name);
  };

  const acceptOffer = async (offer: string) => {
    setWorking(true);
    try {
      const answer = await guestAcceptOffer(offer);
      setAnswerCode(answer);
    } catch {
      pushToast("That offer code was not valid. Ask the host for a fresh one.", "error");
    } finally {
      setWorking(false);
    }
  };

  const cancel = () => {
    leave();
    setAnswerCode(null);
    navigate(ROUTES.peer);
  };

  if (stage === "name") {
    return (
      <div className="wl-stack wl-stack--xloose">
        <PageHeading
          eyebrow="Join"
          title="Join a room"
          lede="Enter the name your teammates will see, then connect to the host."
        />
        <Panel className="wl-stack">
          <TextField
            label="Your name"
            value={name}
            maxLength={settingBounds.playerNameMaxLength}
            placeholder="e.g. Sam"
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            variant="accent"
            size="lg"
            onClick={beginConnect}
            disabled={name.trim().length === 0}
          >
            Continue
          </Button>
        </Panel>
        <div className="wl-cluster wl-cluster--between wl-safe-bottom">
          <Button variant="ghost" onClick={() => navigate(ROUTES.peer)}>
            ← Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="wl-stack wl-stack--xloose">
      <PageHeading
        eyebrow="Join · connecting"
        title="Connect to the host"
        lede="Scan or paste the host’s offer code. We’ll create an answer code for you to send back."
      />

      {answerCode ? (
        <Panel className="wl-stack">
          <ShareCode
            code={answerCode}
            label="Your answer code"
            hint="Show this QR to the host, or send them the code. Keep this screen open until you’re connected."
          />
          <div className="wl-cluster" style={{ justifyContent: "center" }}>
            <Spinner label="Waiting for the host to connect…" />
          </div>
        </Panel>
      ) : (
        <Panel className="wl-stack">
          <EnterCode
            label="The host’s offer code"
            submitLabel="Create answer"
            busy={working}
            onSubmit={(code) => void acceptOffer(code)}
          />
        </Panel>
      )}

      <div className="wl-cluster wl-cluster--between wl-safe-bottom">
        <Button variant="danger" onClick={cancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
