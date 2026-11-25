import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { queryKeys } from '@/shared/lib/queryKeys';
import { updateCategoryName } from '@/modules/products/services/productService';

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: string) => void;
  categories: string[];
}

export function CategorySelectionModal({
  isOpen,
  onClose,
  onSelect,
  categories,
}: CategorySelectionModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string; newName: string }) =>
      updateCategoryName(oldName, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.productsAll });
      toast.success('Categoria atualizada com sucesso');
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar categoria: ' + error.message);
    },
  });

  const handleCreate = () => {
    if (!newCategoryName.trim()) return;
    onSelect(newCategoryName.trim());
    setNewCategoryName('');
    setIsCreating(false);
    onClose();
  };

  const handleUpdate = (oldName: string) => {
    if (!editName.trim() || editName === oldName) {
      setEditingCategory(null);
      return;
    }
    updateMutation.mutate({ oldName, newName: editName.trim() });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isCreating ? (
            <div className="flex gap-2 items-center">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nome da nova categoria"
                autoFocus
              />
              <Button size="icon" onClick={handleCreate}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsCreating(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button className="w-full" variant="outline" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nova Categoria
            </Button>
          )}

          <div className="text-sm font-medium text-muted-foreground mt-4 mb-2">
            Selecione ou Edite:
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent group"
                >
                  {editingCategory === category ? (
                    <div className="flex gap-2 items-center w-full">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                      <Button
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdate(category)}
                        disabled={updateMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingCategory(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="flex-1 text-left font-medium"
                        onClick={() => {
                          onSelect(category);
                          onClose();
                        }}
                        type="button"
                      >
                        {category}
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(category);
                          setEditName(category);
                        }}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
