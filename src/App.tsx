import React, { useRef, useState } from 'react';
import { Header } from './components/layout/Header';
import { Toolbar } from './components/layout/Toolbar';
import { AssetLibrary } from './components/panels/AssetLibrary';
import { UploadsDrawer } from './components/panels/UploadsDrawer';
import { VectorizerSidePanel } from './components/panels/VectorizerSidePanel';
import { PropertiesPanel } from './components/panels/PropertiesPanel';
import { CitationModal } from './components/panels/CitationModal';
import { PropertiesInspector } from './components/toolbar/PropertiesInspector';
import { ShapesDrawer } from './components/panels/ShapesDrawer';
import {
  CanvasViewport,
  CanvasViewportHandle,
} from './components/canvas/CanvasViewport';
import { exportToVectorPdf } from './engines/export/vectorPdf';
import { exportToHighResPng } from './engines/export/rasterExport';
import {
  compileManuscriptCitations,
  CitationReport,
} from './engines/provenance/citationCompiler';
import { useEditorStore } from './stores/useEditorStore';

export const App: React.FC = () => {
  const viewportRef = useRef<CanvasViewportHandle>(null);
  const { documentConfig, setArtboardBackgroundColor } = useEditorStore();
  const [citationReport, setCitationReport] = useState<CitationReport | null>(null);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);

  const handleInsertGenerator = (
    type: 'membrane' | 'dna' | 'activation' | 'inhibition'
  ) => {
    if (type === 'membrane') {
      viewportRef.current?.addMembrane();
    } else if (type === 'dna') {
      viewportRef.current?.addDna();
    } else if (type === 'activation') {
      viewportRef.current?.addActivationArrow();
    } else if (type === 'inhibition') {
      viewportRef.current?.addInhibitionArrow();
    }
  };

  const handleExportPdf = async () => {
    const canvas = viewportRef.current?.getFabricCanvas();
    if (!canvas) return;
    try {
      await exportToVectorPdf(canvas, documentConfig);
    } catch (err) {
      console.error('Failed to export vector PDF:', err);
    }
  };

  const handleExportPng = async () => {
    const canvas = viewportRef.current?.getFabricCanvas();
    if (!canvas) return;
    try {
      await exportToHighResPng(canvas, documentConfig, 300);
    } catch (err) {
      console.error('Failed to export 300 DPI PNG:', err);
    }
  };

  const handleOpenCitations = () => {
    const canvas = viewportRef.current?.getFabricCanvas();
    if (!canvas) return;
    const report = compileManuscriptCitations(canvas);
    setCitationReport(report);
    setIsCitationModalOpen(true);
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-workspace">
      {/* Top Navigation Bar */}
      <Header
        onExportPdf={handleExportPdf}
        onExportPng={handleExportPng}
        onOpenCitations={handleOpenCitations}
      />

      {/* Unified Contextual Properties Ribbon */}
      <PropertiesInspector
        onUndo={() => viewportRef.current?.undo()}
        onRedo={() => viewportRef.current?.redo()}
        onDuplicate={() => viewportRef.current?.duplicateSelected()}
        onDelete={() => viewportRef.current?.deleteSelected()}
        onBringForward={() => viewportRef.current?.bringForward()}
        onSendBackward={() => viewportRef.current?.sendBackward()}
        onBringToFront={() => viewportRef.current?.bringToFront()}
        onSendToBack={() => viewportRef.current?.sendToBack()}
        onFlipX={() => viewportRef.current?.flipX()}
        onFlipY={() => viewportRef.current?.flipY()}
        onToggleLock={() => viewportRef.current?.toggleLockSelected()}
        onGroup={() => viewportRef.current?.groupSelected()}
        onUngroup={() => viewportRef.current?.ungroupSelected()}
        onAlign={(alignment) => viewportRef.current?.alignSelected(alignment)}
        onDistribute={(direction) => viewportRef.current?.distributeSelected(direction)}
        onSetX={(x) => viewportRef.current?.setSelectionX(x)}
        onSetY={(y) => viewportRef.current?.setSelectionY(y)}
        onSetWidth={(w) => viewportRef.current?.setSelectionWidth(w)}
        onSetHeight={(h) => viewportRef.current?.setSelectionHeight(h)}
        onSetAngle={(angle) => viewportRef.current?.setSelectionAngle(angle)}
        onSetOpacity={(opacity) => viewportRef.current?.setSelectionOpacity(opacity)}
        onSetFill={(color) => viewportRef.current?.setSelectionFill(color)}
        onSetStroke={(color, width) => viewportRef.current?.setSelectionStroke(color, width)}
        onSetStrokeDashStyle={(style) => viewportRef.current?.setStrokeDashStyle(style)}
        onSetCornerRadius={(radius) => viewportRef.current?.setCornerRadius(radius)}
        onSetDropShadow={(enabled, options) => viewportRef.current?.setDropShadow(enabled, options)}
        onSetFontFamily={(family) => viewportRef.current?.setFontFamily(family)}
        onSetFontSize={(size) => viewportRef.current?.setFontSize(size)}
        onToggleBold={() => viewportRef.current?.toggleBold()}
        onToggleItalic={() => viewportRef.current?.toggleItalic()}
        onToggleUnderline={() => viewportRef.current?.toggleUnderline()}
        onToggleStrikethrough={() => viewportRef.current?.toggleStrikethrough()}
        onToggleSuperscript={() => viewportRef.current?.toggleSuperscript()}
        onToggleSubscript={() => viewportRef.current?.toggleSubscript()}
        onSetTextAlign={(align) => viewportRef.current?.setTextAlign(align)}
        onSetTextBackgroundColor={(color) => viewportRef.current?.setTextBackgroundColor(color)}
        onSetLineHeight={(val) => viewportRef.current?.setLineHeight(val)}
        onSetCharSpacing={(val) => viewportRef.current?.setCharSpacing(val)}
        onChangeTextCase={(mode) => viewportRef.current?.changeTextCase(mode)}
        onInsertTextAtCursor={(chars) => viewportRef.current?.insertTextAtCursor(chars)}
        onApplyImageFilter={(type, val) => viewportRef.current?.applyImageFilter(type, val)}
        onSetArtboardBackgroundColor={(color) => {
          setArtboardBackgroundColor(color);
          viewportRef.current?.setArtboardBackgroundColor(color);
        }}
        onReplaceColor={(oldHex, newHex) =>
          viewportRef.current?.replaceColor(oldHex, newHex)
        }
        onRecolorSlot={(slotId, newHex) =>
          viewportRef.current?.recolorSlot(slotId, newHex)
        }
        onHoverSlot={(slotId) =>
          viewportRef.current?.highlightColorSlot(slotId)
        }
      />

      {/* Main Canvas Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar
          onAddTextbox={() => viewportRef.current?.addTextbox()}
          onAddRect={() => viewportRef.current?.addRect()}
          onAddCircle={() => viewportRef.current?.addCircle()}
          onDeleteSelected={() => viewportRef.current?.deleteSelected()}
        />

        {/* Shapes, Connectors & Callouts Drawer */}
        <ShapesDrawer
          onInsertShape={(shapeId) => viewportRef.current?.addProceduralShape(shapeId)}
        />

        {/* Scientific Assets & Bio Tools Drawer */}
        <AssetLibrary
          onInsertAsset={(asset) =>
            viewportRef.current?.addSvgFromUrl(asset.svgPath, undefined, asset)
          }
          onInsertGenerator={handleInsertGenerator}
        />

        {/* User Media Uploads Drawer */}
        <UploadsDrawer
          onInsertImage={(image) =>
            viewportRef.current?.addImageFromUrl(image.dataUrl)
          }
          onInsertVector={(vector) =>
            viewportRef.current?.addSvgFromString(vector.svgString)
          }
        />

        {/* Canvas Viewport */}
        <CanvasViewport ref={viewportRef} />

        {/* Right Slide-Out Vectorizer Engine Drawer */}
        <VectorizerSidePanel
          onInsertToCanvas={(svgString) =>
            viewportRef.current?.addSvgFromString(svgString)
          }
        />

        {/* Right Properties & Recolor Panel */}
        <PropertiesPanel
          onSetFill={(color) => viewportRef.current?.setSelectionFill(color)}
          onSetStroke={(color, width) =>
            viewportRef.current?.setSelectionStroke(color, width)
          }
          onSetOpacity={(opacity) =>
            viewportRef.current?.setSelectionOpacity(opacity)
          }
          onUpdateBioParams={(params) =>
            viewportRef.current?.updateActiveBioParams(params)
          }
          onReplaceColor={(oldHex, newHex) =>
            viewportRef.current?.replaceColor(oldHex, newHex)
          }
        />

        {/* Academic Citation & Provenance Modal */}
        <CitationModal
          isOpen={isCitationModalOpen}
          onClose={() => setIsCitationModalOpen(false)}
          report={citationReport}
        />
      </main>
    </div>
  );
};

export default App;
