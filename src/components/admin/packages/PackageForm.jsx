"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import APIs from "@/lib/apis";
import { useRouter } from "@/i18n/navigation";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";
import PackageStepper from "./PackageStepper";
import BasicDetailsStep from "./BasicDetailsStep";
import RelationsStep from "./RelationsStep";
import ItinerariesStep from "./ItinerariesStep";
import DetailsStep from "./DetailsStep";
import PhotosStep from "./PhotosStep";
import { ConfirmationDialog } from "./PackageUI";

export default function PackageForm({ packageRecord = null }) {
  const router = useRouter();
  const [record, setRecord] = useState(packageRecord);
  const [step, setStep] = useState(
    packageRecord?.is_complete || packageRecord?.current_step === 6
      ? 1
      : (packageRecord?.current_step ?? 1),
  );
  const [busy, setBusy] = useState(false);
  const [revisions, setRevisions] = useState({});
  const [confirmation, setConfirmation] = useState(null);
  const dirtyRef = useRef({});
  const busyRef = useRef(false);
  const packageIdRef = useRef(packageRecord?.id ?? null);
  const onDirty = useCallback((number, value) => {
    dirtyRef.current[number] = value;
  }, []);
  const onBusy = useCallback((value) => {
    busyRef.current = value;
    setBusy(value);
  }, []);
  const title = packageRecord ? "Edit Package" : "Add Package";

  useEffect(() => {
    function beforeUnload(event) {
      if (busyRef.current || Object.values(dirtyRef.current).some(Boolean)) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  function navigate(number) {
    if (busyRef.current || number === step) return;
    if (
      number !== null &&
      !(
        record?.is_complete ||
        record?.current_step === 6 ||
        record?.completed_steps?.includes(number) ||
        number <= (record?.current_step ?? 1)
      )
    )
      return;
    const hasEdits =
      number === null
        ? Object.values(dirtyRef.current).some(Boolean)
        : dirtyRef.current[step];
    if (hasEdits) {
      setConfirmation({ step: number });
      return;
    }
    if (number === null) router.push("/admin/packages");
    else setStep(number);
  }

  async function save(number, payload) {
    let response;
    const id = packageIdRef.current;
    if (number === 1)
      response = id
        ? await APIs.admin.packages.updatePackage(id, payload)
        : await APIs.admin.packages.createPackage(payload);
    if (number === 2)
      response = await APIs.admin.packages.saveRelations(id, payload);
    if (number === 3)
      response = await APIs.admin.packages.saveItineraries(id, payload);
    if (number === 4)
      response = await APIs.admin.packages.saveDetails(id, payload);
    if (number === 5)
      response = await APIs.admin.packages.savePhotos(id, payload);
    if (!response?.status || !response.data?.id)
      throw {
        message:
          response?.message || "The backend did not return the saved package.",
      };
    packageIdRef.current = response.data.id;
    dirtyRef.current[number] = false;
    setRecord(response.data);
    // Reset only the saved step. Other mounted forms retain local edits.
    setRevisions((values) => ({
      ...values,
      [number]: (values[number] ?? 0) + 1,
    }));
    toast.success(response.message || "Package step saved successfully.", {
      position: "bottom-center",
    });
    if (number === 5) {
      if (Object.values(dirtyRef.current).some(Boolean))
        setConfirmation({ step: null, finished: true });
      else router.push("/admin/packages");
    } else if (!id) {
      router.replace(
        `/admin/packages/${encodeURIComponent(response.data.id)}/edit`,
      );
    } else setStep(number + 1);
  }

  const props = {
    record,
    busy,
    onSave: save,
    onNavigate: navigate,
    onDirty,
    onBusy,
  };
  return (
    <div className="w-full min-w-0 space-y-5 text-[#0b164d] dark:text-gray-100">
      <PageBreadcrumb
        pageTitle={title}
        description="Build your package in five steps."
        breadcrumbs={[
          { label: "Home", href: "/admin/dashboard" },
          { label: "Packages", href: "/admin/packages" },
          { label: title },
        ]}
      />
      <PackageStepper
        step={step}
        record={record}
        busy={busy}
        onNavigate={navigate}
      />
      <BasicDetailsStep
        key={`basic-${revisions[1] ?? 0}`}
        {...props}
        active={step === 1}
      />
      <RelationsStep
        key={`relations-${revisions[2] ?? 0}`}
        {...props}
        active={step === 2}
      />
      <ItinerariesStep
        key={`itineraries-${revisions[3] ?? 0}`}
        {...props}
        active={step === 3}
      />
      <DetailsStep
        key={`details-${revisions[4] ?? 0}`}
        {...props}
        active={step === 4}
      />
      <PhotosStep
        key={`photos-${revisions[5] ?? 0}`}
        {...props}
        active={step === 5}
        finalLabel={
          packageRecord?.is_complete || packageRecord?.current_step === 6
            ? "Save Changes"
            : "Create Package"
        }
      />
      {confirmation && (
        <ConfirmationDialog
          title={
            confirmation.step === null
              ? "Leave package editor?"
              : "Unsaved changes"
          }
          description={
            confirmation.step === null
              ? `${confirmation.finished ? "Photos were saved. " : ""}Unsaved changes will be discarded when you leave.`
              : "This step has unsaved changes. Your values will be kept while you visit another step, but will not be saved until you submit this step."
          }
          confirmLabel={
            confirmation.step === null ? "Leave editor" : "Continue"
          }
          busy={busy}
          onClose={() => setConfirmation(null)}
          onConfirm={() => {
            const target = confirmation.step;
            setConfirmation(null);
            if (target === null) router.push("/admin/packages");
            else setStep(target);
          }}
        />
      )}
    </div>
  );
}
